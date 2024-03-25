import { LLM_PROVIDER } from "$/consts/envs.ts";
import { ANTHROPIC } from "$/consts/llm.ts";
import { getEnv } from "$/utils/env.ts";

function getModule(provider?: string) {
  switch (provider) {
    case ANTHROPIC:
      return import("$/providers/llm/anthropic.ts");
    default:
      throw new Error(`Try one of the following: ${ANTHROPIC}.`, {
        cause: `Unsupported LLM provider: ${provider}.`,
      });
  }
}

/**
 * Returns the LLM client based on the environment variable LLM_PROVIDER.
 *
 * @returns The LLM client.
 * @throws {EnvNotSet} If the LLM_PROVIDER environment variable is not set.
 * @throws {Error} If an unsupported LLM provider is specified.
 *
 * @example
 * ```typescript
 * import { getClient } from "$/providers/llm/client.ts";
 *
 * const client = await getClient();
 * const response = await client.createChatcomplete({});
 * console.log(response);
 * ```
 */
export async function getClient() {
  return (await getModule(getEnv(LLM_PROVIDER))).default;
}
