import { LLM_PROVIDER } from "$/consts/envs.ts";
import { ANTHROPIC } from "$/consts/llm.ts";
import { ConfigurationNotSet } from "$/utils/errors.ts";

function get_module(provider: string) {
  switch (provider) {
    case ANTHROPIC:
      return import("$/llm/providers/anthropic.ts");
    default:
      throw new Error(`Unsupported LLM provider: ${provider}.`, {
        cause: `Try one of the following: ${ANTHROPIC}.`,
      });
  }
}

export async function get_client() {
  const provider = Deno.env.get(LLM_PROVIDER);
  if (!provider) {
    throw new ConfigurationNotSet(LLM_PROVIDER);
  }
  return (await get_module(provider)).default;
}
