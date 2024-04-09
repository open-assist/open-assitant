import {
  AssistantResponse,
  FileObject,
  MessageObject,
  StepObject,
  Tool,
  CreateChatCompletionRequest,
} from "@open-schemas/zod/openai";
import { CreateMessageRequest, Message } from "@open-schemas/zod/anthropic";
import * as log from "$std/log/mod.ts";
import { Base } from "$/providers/llm/base.ts";
import { ANTHROPIC_API_KEY, ANTHROPIC_API_URL, ANTHROPIC_VERSION } from "$/consts/envs.ts";
import { logResponseError, logRejectionReason } from "$/utils/log.ts";
import {
  CompletionRequestToMessageRequest,
  CreateMessageResponseToChatCompletionObject,
  CreateMessageResponseToAssistantResponse,
  MessageObjectToMessage,
  StepObjectToMessages,
} from "$/schemas/anthropic/messages.ts";
import { MessageToChunkStream } from "$/schemas/anthropic/streaming_messages.ts";
import { USER_PROMPT, FILES_PROMPT } from "$/utils/prompts.ts";
import { XML } from "$/utils/xml.ts";
import { ConvertRetrievalToolToTools } from "$/schemas/anthropic/messages.ts";
import { getEnv } from "$/utils/env.ts";
import { APPLICATION_JSON_HEADER } from "$/consts/api.ts";

// consts for Anthropic
const DEFAULT_ANTHROPIC_API_URL = "https://api.anthropic.com";
const DEFAULT_ANTHROPIC_VERSION = "2023-06-01";

export default class Anthropic extends Base {
  static apiVersion = "v1";

  protected static _fetch(input: string, init?: RequestInit) {
    const apiKey = getEnv(ANTHROPIC_API_KEY);
    const url = Deno.env.get(ANTHROPIC_API_URL) ?? DEFAULT_ANTHROPIC_API_URL;
    const version = Deno.env.get(ANTHROPIC_VERSION) ?? DEFAULT_ANTHROPIC_VERSION;
    return fetch(`${url}/${this.apiVersion}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        ...APPLICATION_JSON_HEADER,
        "anthropic-version": version,
        "anthropic-beta": "tools-2024-04-04",
        "x-api-key": apiKey,
      },
    }).then(logResponseError);
  }

  static async createChatCompletion(request: CreateChatCompletionRequest, mappedModel?: string) {
    const response = await this._fetch("/messages", {
      method: "POST",
      body: JSON.stringify(CompletionRequestToMessageRequest.parse(request)),
    });

    if (request.stream) {
      const { readable, writable } = new MessageToChunkStream(mappedModel);
      response.body?.pipeTo(writable).catch(logRejectionReason);
      return readable;
    }

    const completion = await CreateMessageResponseToChatCompletionObject.parseAsync(
      await response.json(),
    );
    if (mappedModel) {
      completion.model = mappedModel;
    }
    return completion;
  }

  private static genSystem(
    instructions?: string | null,
    _tools?: Tool[] | null,
    files?: FileObject[],
  ) {
    let system = "";
    if (instructions) {
      system = `${USER_PROMPT}\n${instructions}`;
    }

    if (files) {
      const fileInfos = files.map((f) => ({ file_id: f.id, file_name: f.filename }));
      system = `${system}\n${FILES_PROMPT}\n<files>${XML.stringify(fileInfos, {
        arrayNodeName: "file",
        format: true,
      })}</files>\n`;
    }

    log.debug(`[genSystem] ${system}`);
    return system;
  }

  private static convertToMessages(openAiMessages: MessageObject[], steps: StepObject[]) {
    const messages: Message[] = [];
    let mIdx = 0,
      sIdx = 0;
    while (mIdx < openAiMessages.length && sIdx < steps.length) {
      const m = openAiMessages.at(mIdx)?.created_at as number;
      const s = steps.at(sIdx)?.created_at as number;
      if (m <= s) {
        messages.push(MessageObjectToMessage.parse(openAiMessages.at(mIdx)));
        mIdx += 1;
      } else {
        messages.push(...StepObjectToMessages.parse(steps.at(sIdx)));
        sIdx += 1;
      }
    }
    while (mIdx < openAiMessages.length) {
      messages.push(MessageObjectToMessage.parse(openAiMessages.at(mIdx)));
      mIdx += 1;
    }
    while (sIdx < steps.length) {
      messages.push(...StepObjectToMessages.parse(steps.at(sIdx)));
      sIdx += 1;
    }
    return messages;
  }

  static async runStep(
    model: string,
    messages: MessageObject[],
    steps: StepObject[],
    instructions?: string | null,
    tools?: Tool[] | null,
    files?: FileObject[],
  ): Promise<AssistantResponse> {
    const selfTools = tools?.map((t) => {
      if (t.type === "retrieval") {
        return ConvertRetrievalToolToTools.parse(t);
      }
    });
    const request = CreateMessageRequest.parse({
      model,
      system: this.genSystem(instructions, tools, files),
      messages: this.convertToMessages(messages, steps),
      max_tokens: 4096,
      tools: selfTools?.flatMap((t) => t),
    } as CreateMessageRequest);
    const response = await this._fetch("/messages", {
      method: "POST",
      body: JSON.stringify(request),
    });
    const messageResponse = await response.json();
    log.debug(`[runStep] messageResponse: ${JSON.stringify(messageResponse)}`);
    const assistantResponse =
      await CreateMessageResponseToAssistantResponse.parseAsync(messageResponse);
    return assistantResponse;
  }
}
