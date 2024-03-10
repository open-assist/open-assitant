import {
  CreateChatCompletionRequest,
  CreateChatCompletionRequestType,
} from "openai_schemas";
import { GOOGLE_API_URL, GOOGLE_API_KEY } from "$/utils/constants.ts";
import {
  CreateChatCompletionRequestToGenerateContentRequest,
  GenerateContentResponseToCreateChatCompletionResponse,
} from "$/providers/google/transforms.ts";
import { GenerateContentTransformStream } from "$/providers/google/streams.ts";

export default class Client {
  static apiVersion = "v1beta";

  public static async createChatCompletion(
    request: CreateChatCompletionRequestType,
    mappedModel?: string,
  ) {
    const modelMethod = request.stream
      ? "streamGenerateContent"
      : "generateContent";
    const response = await this.fetch(
      `/models/${request.model}:${modelMethod}`,
      {
        method: "POST",
        body: JSON.stringify(
          CreateChatCompletionRequestToGenerateContentRequest.parse(request),
        ),
      },
    );

    if (request.stream) {
      const { writable, readable } = new GenerateContentTransformStream(
        mappedModel ?? request.model,
      );
      response.body?.pipeTo(writable).catch((e) => {
        if ("" + e === "resource closed") return;
        console.error("[google] response error:", e);
      });
      return readable;
    }

    const completion =
      GenerateContentResponseToCreateChatCompletionResponse.parse(
        await response.json(),
      );
    completion.model = mappedModel ?? request.model;
    return completion;
  }

  private static fetch(input: string, init?: RequestInit) {
    return fetch(`${Deno.env.get(GOOGLE_API_URL)}/${this.apiVersion}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "X-Goog-Api-Key": Deno.env.get(GOOGLE_API_KEY) as string,
      },
    });
  }
}
