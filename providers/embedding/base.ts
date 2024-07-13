import { NotImplemented } from "$/utils/errors.ts";
import {
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
} from "$/types/openai/embedding.ts";

/**
 * Base class for embedding model providers.
 * Provides a common interface for creating chat completions.
 *
 * @example
 * ```ts
 * import { Base } from "$/providers/embedding/base.ts";
 *
 * class Client extends Base {
 *   static createEmbedding() {
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
   * Creates an embedding vector representing the input text.
   *
   * @param _request - The embedding request.
   * @param _mappedModel - Optional mapped model to use for the embedding.
   *
   * @returns A promise that resolves to the create embedding response.
   * @throws {NotImplemented} If the method is not implemented.
   *
   * @example
   * ```ts
   * import { Base } from "$/providers/embedding/base.ts";
   *
   * Base.createEmbedding(...);
   * ```
   */
  static createEmbedding(
    _request: CreateEmbeddingRequest,
    _mappedModel?: string,
  ): Promise<CreateEmbeddingResponse> {
    throw new NotImplemented("Base.createEmbedding");
  }
}
