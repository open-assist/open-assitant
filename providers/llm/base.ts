import { NotImplemented } from "$/utils/errors.ts";
import {
  ChatCompletionObject,
  CreateChatCompletionRequest,
  MessageObject,
  StepObject,
  Tool,
  FileObject,
} from "@open-schemas/zod/openai";
import { AssistantResponse } from "$open-schemas/zod/openai/mod.ts";

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
  protected static _fetch(_input: string, _init?: RequestInit): Promise<Response> {
    throw new NotImplemented("Base._fetch");
  }

  /**
   * Creates a chat completion based on the given request.
   *
   * @param _request - The chat completion request.
   * @param _mappedModel - Optional mapped model to use for the completion.
   *
   * @returns A promise that resolves to the chat completion response or a readable stream.
   * @throws {NotImplemented} If the method is not implemented.
   *
   * @example
   * ```ts
   * import { Base } from "$/providers/llm/base.ts";
   *
   * Base.createChatCompletion(...);
   * ```
   */
  static createChatCompletion(
    _request: CreateChatCompletionRequest,
    _mappedModel?: string,
  ): Promise<ChatCompletionObject | ReadableStream> {
    throw new NotImplemented("Base.createChatCompletion");
  }

  static runStep(
    _model: string,
    _messages: MessageObject[],
    _steps: StepObject[],
    _instructions?: string | null,
    _tools?: Tool[] | null,
    _files?: FileObject[],
  ): Promise<AssistantResponse> {
    throw new NotImplemented("Base.runStep");
  }
}
