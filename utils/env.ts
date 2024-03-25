import { NotSet } from "$/utils/errors.ts";

/**
 * Gets the value of an environment variable.
 *
 * @param name - The name of the environment variable.
 * @param required - Whether the environment variable is required. Defaults to true.
 * @returns The value of the environment variable, or undefined if it is not set and not required.
 * @throws {NotSet} If the environment variable is required but not set.
 *
 * @example
 * ```ts
 * import { getEnv } from "$/utils/env.ts";
 *
 * // Get a required environment variable
 * const apiKey = getEnv('API_KEY');
 *
 * // Get an optional environment variable
 * const debugMode = getEnv('DEBUG_MODE', false);
 * ```
 */
export function getEnv(name: string, required: boolean = true) {
  const env = Deno.env.get(name);
  if (required && !env) {
    throw new NotSet(name);
  }
  return env;
}
