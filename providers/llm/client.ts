import { LLM_PROVIDER } from "$/consts/envs.ts";
import { ANTHROPIC } from "$/consts/llm.ts";
import { EnvNotSet } from "$/utils/errors.ts";

function getModule(provider: string) {
  switch (provider) {
    case ANTHROPIC:
      return import("$/providers/llm/anthropic.ts");
    default:
      throw new Error(`Unsupported LLM provider: ${provider}.`, {
        cause: `Try one of the following: ${ANTHROPIC}.`,
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
  const provider = Deno.env.get(LLM_PROVIDER);
  if (!provider) {
    throw new EnvNotSet(LLM_PROVIDER);
  }
  return (await getModule(provider)).default;
}
