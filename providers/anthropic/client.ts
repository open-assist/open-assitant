import type { CreateChatCompletionRequestType } from "openai_schemas";
import {
  CreateChatCompletionRequestToCreateMessageRequest,
  CreateMessageResponseToCreateChatCompletionResponse,
} from "$/providers/anthropic/transforms.ts";
import { MessageTransformStream } from "$/providers/anthropic/streams.ts";
import { logRejectionReason } from "$/providers/log.ts";
import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_API_URL,
  ANTHROPIC_VERSION,
} from "$/utils/constants.ts";

export default class Client {
  static apiVersion = "v1";

  private static fetch(input: string, init?: RequestInit) {
    return fetch(
      `${Deno.env.get(ANTHROPIC_API_URL)}/${this.apiVersion}${input}`,
      {
        ...init,
        headers: {
          ...init?.headers,
          "content-type": "application/json",
          "anthropic-version": Deno.env.get(ANTHROPIC_VERSION) as string,
          "x-api-key": Deno.env.get(ANTHROPIC_API_KEY) as string,
        },
      },
    );
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
      response.body?.pipeTo(writable).catch(logRejectionReason);
      return readable;
    }

    const completion = CreateMessageResponseToCreateChatCompletionResponse
      .parse(
        await response.json(),
      );
    if (mappedModel) {
      completion.model = mappedModel;
    }
    return completion;
  }
}
