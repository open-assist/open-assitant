import { CreateChatCompletionRequestType } from "openai_schemas";
import {
  CreateChatCompletionRequestToChatRequest,
  ChatResponseToCreateChatCompletionResponse,
} from "$/providers/ollama/transforms.ts";
import { ChatTransformStream } from "$/providers/ollama/streams.ts";
import { InternalServerError } from "$/utils/errors.ts";
import { OLLAMA_API_URL } from "$/utils/constants.ts";
import * as log from "$std/log/mod.ts";
import { logRejectionReason } from "$/providers/log.ts";

const LOG_TAG = "Ollama";

export default class Client {
  /**
   * Map openai's `/chat/completions` api to `/api/chat` api of ollama.
   *
   * @param {CreateChatCompletionRequestType} request in openai format
   * @param {string} [mappedModel] - Optional model override for the anthropic response.
   *   If provided, the model property will be set to this value.
   *
   * @returns the chat completion object or the readable stream of chat completion chunk.
   */
  public static async createChatCompletion(
    request: CreateChatCompletionRequestType,
    mappedModel?: string,
  ) {
    const response = await this.fetch("/chat", {
      method: "POST",
      body: JSON.stringify(
        CreateChatCompletionRequestToChatRequest.parse(request),
      ),
    });

    if (request.stream) {
      const { readable, writable } = new ChatTransformStream();
      response.body?.pipeTo(writable).catch(logRejectionReason);
      return readable;
    }

    const completion = ChatResponseToCreateChatCompletionResponse.parse(
      await response.json(),
    );
    if (mappedModel) {
      completion.model = mappedModel;
    }
    return completion;
  }

  private static fetch(input: string, init?: RequestInit) {
    return fetch(`${Deno.env.get(OLLAMA_API_URL)}/api${input}`, init).then(
      (response) => {
        if (response.status >= 400) {
          response.json().then((body) => {
            log.error(
              `[${LOG_TAG}] client fetch with response status: ${response.status}, body: ${JSON.stringify(body)}`,
            );
          });
          throw new InternalServerError();
        }
        return response;
      },
    );
  }
}
