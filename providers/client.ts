import {
  CreateChatCompletionRequestType,
  CreateChatCompletionResponseType,
} from "openai_schemas";
import anthropic from "$/providers/anthropic/client.ts";
import { getProvider } from "$/utils/provider.ts";

export default class Client {
  private static getProviderClient() {
    const provider = getProvider();
    switch (provider) {
      case "anthropic":
      case "google":
      case "ollama":
      default:
        return anthropic;
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
