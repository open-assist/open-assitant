import { Base } from "$/llm/base.ts";
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
import { CreateChatCompletionRequestType } from "openai_schemas";
import {
  CompletionRequestToMessageRequest,
  CreateMessageResponseToCreateChatCompletionResponse,
} from "$/schemas/anthropic/messages.ts";
import { ConfigurationNotSet } from "$/utils/errors.ts";

export default class Anthropic extends Base {
  static apiVersion = "v1";

  protected static _fetch(input: string, init?: RequestInit) {
    const apiKey = Deno.env.get(ANTHROPIC_API_KEY);
    if (!apiKey) {
      throw new ConfigurationNotSet(ANTHROPIC_API_KEY);
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
    request: CreateChatCompletionRequestType,
    mappedModel?: string,
  ) {
    const response = await this._fetch("/messages", {
      method: "POST",
      body: JSON.stringify(CompletionRequestToMessageRequest.parse(request)),
    });

    // if (request.stream) {
    //   const { readable, writable } = new MessageTransformStream(mappedModel);
    //   response.body?.pipeTo(writable).catch(logRejectionReason);
    //   return readable;
    // }

    const completion =
      CreateMessageResponseToCreateChatCompletionResponse.parse(
        await response.json(),
      );
    if (mappedModel) {
      completion.model = mappedModel;
    }
    return completion;
  }
}
