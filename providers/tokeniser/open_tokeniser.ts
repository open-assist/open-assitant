import { TOKENISER_API_URL } from "$/consts/envs.ts";

/**
 * The client for OpenTokeniser service.
 */
export default class Client {
  static baseURL = Deno.env.get(TOKENISER_API_URL) ??
    "http://localhost:8001";

  static fetch(input: string, init?: RequestInit) {
    return fetch(`${this.baseURL}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "Content-Type": "application/json",
      },
    });
  }

  static async createChunks(
    content: string,
    maxChunkSize?: number,
    chunkOverlap?: number,
  ): Promise<{ content: string; tokens: number }[]> {
    return await this.fetch("/chunks", {
      method: "POST",
      body: JSON.stringify({
        content,
        max_chunk_size_tokens: maxChunkSize,
        chunk_overlap_tokens: chunkOverlap,
      }),
    }).then((r) => {
      return r.json();
    });
  }
}
