import { AssistantResponse, MessageObject, StepObject, Tool } from "@open-schemas/zod/openai";
import { CreateMessageRequest, Message } from "@open-schemas/zod/anthropic";
import { Base } from "$/providers/llm/base.ts";
import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_API_URL,
  ANTHROPIC_VERSION,
  LLM_HAS_MULTIMODAL_MODELS,
} from "$/consts/envs.ts";
import { DEFAULT_ANTHROPIC_API_URL, DEFAULT_ANTHROPIC_VERSION, CALLS_STOP } from "$/consts/llm.ts";
import { logResponseError } from "$/utils/log.ts";
import { CreateChatCompletionRequest } from "@open-schemas/zod/openai";
import {
  CompletionRequestToMessageRequest,
  CreateMessageResponseToChatCompletionObject,
} from "$/schemas/anthropic/messages.ts";
import { MessageToChunkStream } from "$/schemas/anthropic/streaming_messages.ts";
import { EnvNotSet } from "$/utils/errors.ts";
import { logRejectionReason } from "$/utils/log.ts";
import { MessageObjectToMessage } from "$/schemas/anthropic/messages.ts";
import { StepObjectToMessages } from "$/schemas/anthropic/messages.ts";
import {
  ASSISTANT_PROMPT,
  USER_PROMPT,
  TOOLS_PROMPT,
  CODE_INTERPRETER_TOOLS_PROMPT,
  RETRIEVAL_TOOLS_PROMPT,
  FUNCTION_TOOLS_PROMPT,
  MULTIMODAL_MODEL_PROMPT,
} from "$/utils/prompts.ts";
import { XML } from "$/utils/xml.ts";
import { CreateMessageResponseToAssistantResponse } from "$/schemas/anthropic/messages.ts";

export default class Anthropic extends Base {
  static apiVersion = "v1";

  protected static _fetch(input: string, init?: RequestInit) {
    const apiKey = Deno.env.get(ANTHROPIC_API_KEY);
    if (!apiKey) {
      throw new EnvNotSet(ANTHROPIC_API_KEY);
    }
    const url = Deno.env.get(ANTHROPIC_API_URL) ?? DEFAULT_ANTHROPIC_API_URL;
    const version = Deno.env.get(ANTHROPIC_VERSION) ?? DEFAULT_ANTHROPIC_VERSION;
    return fetch(`${url}/${this.apiVersion}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "content-type": "application/json",
        "anthropic-version": version,
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

  private static genSystem(instructions?: string | null, tools?: Tool[] | null) {
    let system = ASSISTANT_PROMPT;
    if (Deno.env.get(LLM_HAS_MULTIMODAL_MODELS)) {
      system = `${system}${MULTIMODAL_MODEL_PROMPT}`;
    }
    if (tools) {
      system = `${system}${TOOLS_PROMPT}`;
      if (tools.find((t) => t.type === "code_interpreter"))
        system = `${system}${CODE_INTERPRETER_TOOLS_PROMPT}`;
      if (tools.find((t) => t.type === "retrieval")) system = `${system}${RETRIEVAL_TOOLS_PROMPT}`;
      const functionTools = tools.filter((t) => t.type === "function");
      if (functionTools.length > 0) {
        system = `${system}${FUNCTION_TOOLS_PROMPT}\n<calls>\n${XML.stringify(functionTools, {
          arrayNodeName: "tool_call",
          format: true,
        })}</calls>\n`;
      }
    }
    if (instructions) {
      system = `${system}${USER_PROMPT}\n${instructions}`;
    }
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
  ): Promise<AssistantResponse> {
    const request = CreateMessageRequest.parse({
      model,
      system: this.genSystem(instructions, tools),
      messages: this.convertToMessages(messages, steps),
      max_tokens: 4096,
      stop_sequences: tools ? [CALLS_STOP] : undefined,
    } as CreateMessageRequest);
    const response = await this._fetch("/messages", {
      method: "POST",
      body: JSON.stringify(request),
    });
    const assistantResponse = await CreateMessageResponseToAssistantResponse.parseAsync(
      await response.json(),
    );
    return assistantResponse;
  }
}
