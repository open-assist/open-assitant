import {
  CreateChatCompletionRequestType,
  CreateChatCompletionResponseType,
} from "openai_schemas";
import anthropic from "$/providers/anthropic/client.ts";
import google from "$/providers/google/client.ts";
import ollama from "$/providers/ollama/client.ts";
import { getProvider } from "$/utils/provider.ts";
import { InternalServerError } from "$/utils/errors.ts";

export default class Client {
  private static getProviderClient() {
    const provider = getProvider();
    switch (provider) {
      case "anthropic":
        return anthropic;
      case "google":
        return google;
      case "ollama":
        return ollama;
      default:
        throw new InternalServerError(undefined, {
          cause: "Unknown provider",
        });
    }
  }

  public static createChatCompletion(
    request: CreateChatCompletionRequestType,
    mappedModel?: string,
  ): Promise<CreateChatCompletionResponseType | ReadableStream> {
    const client = this.getProviderClient();
    return client.createChatCompletion(request, mappedModel);
  }
}
