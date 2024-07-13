import { EMBEDDING_POVIDER } from "$/consts/envs.ts";
import { GOOGLE } from "$/consts/providers.ts";
import { getEnv } from "$/utils/env.ts";

function getModule(provider?: string) {
  switch (provider) {
    case GOOGLE:
      return import("$/providers/embedding/google.ts");
    default:
      throw new Error(`Try one of the following: ${GOOGLE}.`, {
        cause: `Unsupported LLM provider: ${provider}.`,
      });
  }
}

/**
 * Returns the embedding client based on the environment variable EMBEDDING_POVIDER.
 *
 * @returns The embedding client.
 * @throws {EnvNotSet} If the EMBEDDING_POVIDER environment variable is not set.
 * @throws {Error} If an unsupported embedding provider is specified.
 *
 * @example
 * ```typescript
 * import { getClient } from "$/providers/embedding/client.ts";
 *
 * const client = await getClient();
 * const response = await client.createEmbedding({});
 * console.log(response);
 * ```
 */
export async function getClient() {
  return (await getModule(getEnv(EMBEDDING_POVIDER))).default;
}
