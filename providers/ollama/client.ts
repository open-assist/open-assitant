import { CreateChatCompletionRequestType } from "openai_schemas";
import {
  CreateChatCompletionRequestToChatRequest,
  ChatResponseToCreateChatCompletionResponse,
} from "$/providers/ollama/transforms.ts";
import { ChatTransformStream } from "$/providers/ollama/streams.ts";

export default class Client {
  private static fetch(input: string, init?: RequestInit) {
    return fetch(`${Deno.env.get("OLLAMA_API_URL")}/api${input}`, init);
  }

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
      response.body?.pipeTo(writable).catch((e) => {
        if ("" + e === "resource closed") {
          return;
        }
        console.error(`[ollama] resposne error: ${e}`);
      });
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
}
