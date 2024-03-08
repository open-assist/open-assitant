import { InternalServerError } from "$/utils/errors.ts";

export type ProviderType = "anthropic" | "google" | "ollama";

export function getProvider() {
  const provider = Deno.env.get("PROVIDER");
  if (!provider) {
    throw new InternalServerError(undefined, {
      cause: "No provider configuration!",
    });
  }
  return provider as ProviderType;
}
