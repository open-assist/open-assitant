import { NotImplemented } from "$/utils/errors.ts";
import {
  CreateChatCompletionRequest,
  ChatCompletionObject,
} from "@open-schemas/zod/openai";

/**
 * Base class for language model providers.
 * Provides a common interface for creating chat completions.
 *
 * @example
 * ```ts
 * import { Base } from "$/providers/llm/base.ts";
 *
 * class Client extends Base {
 *   static createChatCompletion() {
 *     ...
 *   }
 * }
 * ```
 */
export class Base {
  protected static _fetch(
    _input: string,
    _init?: RequestInit,
  ): Promise<Response> {
    throw new NotImplemented("Base._fetch");
  }

  /**
   * Creates a chat completion based on the given request.
   *
   * @example
   * ```ts
   * import { Base } from "$/providers/llm/base.ts";
   *
   * Base.createChatCompletion(...);
   * ```
   *
   * @param _request - The chat completion request.
   * @param _mappedModel - Optional mapped model to use for the completion.
   *
   * @returns A promise that resolves to the chat completion response or a readable stream.
   * @throws {NotImplemented} If the method is not implemented.
   */
  static createChatCompletion(
    _request: CreateChatCompletionRequest,
    _mappedModel?: string,
  ): Promise<ChatCompletionObject | ReadableStream> {
    throw new NotImplemented("Base.createChatCompletion");
  }
}
