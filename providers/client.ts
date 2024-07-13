import { CreateChatCompletionRequest } from "$open-schemas/types/openai/mod.ts";
import google from "$/providers/google/client.ts";
import ollama from "$/providers/ollama/client.ts";
import { getProvider } from "$/utils/llm.ts";
import { InternalServerError } from "$/utils/errors.ts";

/**
 * Client class for interacting with different providers to create chat completions.
 * It selects the appropriate provider client based on the configured provider.
 * Supports Anthropic, Google, and Ollama providers.
 */
export default class Client {
  /**
   * Retrieves the appropriate provider client based on the configured provider.
   * @returns The provider client instance.
   * @throws {InternalServerError} If the configured provider is unknown.
   */
  private static getProviderClient() {
    const provider = getProvider();
    switch (provider) {
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
  /**
   * Creates a chat completion using the appropriate provider client.
   * @param request The chat completion request object.
   * @param mappedModel Optional mapped model name for the provider.
   * @returns A promise that resolves to the chat completion response or a readable stream.
   */
  public static createChatCompletion(
    request: CreateChatCompletionRequest,
    mappedModel?: string,
  ) {
    const client = this.getProviderClient();
    return client.createChatCompletion(request, mappedModel);
  }
}
