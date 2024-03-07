import { env } from "$/fresh.config.ts";
import { InternalServerError } from "$/utils/errors.ts";

export type ProviderType = "anthropic" | "google" | "ollama";

export function getProvider() {
  const provider = env["PROVIDER"];
  if (!provider) {
    throw new InternalServerError(undefined, {
      cause: "No provider configuration!",
    });
  }
  return provider as ProviderType;
}
