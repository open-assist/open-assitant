import { env } from "$/fresh.config.ts";
import type { CreateChatCompletionRequestType } from "openai_schemas";
import {
  CreateChatCompletionRequestToCreateMessageRequest,
  CreateMessageResponseToCreateChatCompletionResponse,
} from "$/providers/anthropic/transforms.ts";
import { MessageTransformStream } from "$/providers/anthropic/streams.ts";

export default class Client {
  static baseURL = "https://api.anthropic.com";
  static apiVersion = "v1";
  static version = "2023-06-01";

  private static fetch(input: string, init?: RequestInit) {
    return fetch(`${this.baseURL}/${this.apiVersion}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "content-type": "application/json",
        "anthropic-version": this.version,
        "x-api-key": env["ANTHROPIC_API_KEY"],
      },
    });
  }

  public static async createChatCompletion(
    request: CreateChatCompletionRequestType,
    mappedModel?: string,
  ) {
    const response = await this.fetch("/messages", {
      method: "POST",
      body: JSON.stringify(
        CreateChatCompletionRequestToCreateMessageRequest.parse(request),
      ),
    });

    if (request.stream) {
      const { readable, writable } = new MessageTransformStream(mappedModel);
      response.body?.pipeTo(writable);
      return readable;
    }

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
