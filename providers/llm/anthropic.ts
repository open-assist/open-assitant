import { Base } from "$/providers/llm/base.ts";
import {
  ANTHROPIC_API_URL,
  ANTHROPIC_VERSION,
  ANTHROPIC_API_KEY,
} from "$/consts/envs.ts";
import {
  DEFAULT_ANTHROPIC_API_URL,
  DEFAULT_ANTHROPIC_VERSION,
} from "$/consts/llm.ts";
import { logResponseError } from "$/utils/log.ts";
import { CreateChatCompletionRequest } from "@open-schemas/zod/openai";
import {
  CompletionRequestToMessageRequest,
  CreateMessageResponseToChatCompletionObject,
} from "$/schemas/anthropic/messages.ts";
import { MessageToChunkStream } from "$/schemas/anthropic/streaming_messages.ts";
import { EnvNotSet } from "$/utils/errors.ts";
import { logRejectionReason } from "$/utils/log.ts";

export default class Anthropic extends Base {
  static apiVersion = "v1";

  protected static _fetch(input: string, init?: RequestInit) {
    const apiKey = Deno.env.get(ANTHROPIC_API_KEY);
    if (!apiKey) {
      throw new EnvNotSet(ANTHROPIC_API_KEY);
    }
    const url = Deno.env.get(ANTHROPIC_API_URL) ?? DEFAULT_ANTHROPIC_API_URL;
    const version =
      Deno.env.get(ANTHROPIC_VERSION) ?? DEFAULT_ANTHROPIC_VERSION;
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

  static async createChatCompletion(
    request: CreateChatCompletionRequest,
    mappedModel?: string,
  ) {
    const response = await this._fetch("/messages", {
      method: "POST",
      body: JSON.stringify(CompletionRequestToMessageRequest.parse(request)),
    });

    if (request.stream) {
      const { readable, writable } = new MessageToChunkStream(mappedModel);
      response.body?.pipeTo(writable).catch(logRejectionReason);
      return readable;
    }

    const completion =
      await CreateMessageResponseToChatCompletionObject.parseAsync(
        await response.json(),
      );
    if (mappedModel) {
      completion.model = mappedModel;
    }
    return completion;
  }
}
