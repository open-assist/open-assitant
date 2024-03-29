import { NotSet } from "$/utils/errors.ts";

/**
 * Gets the value of an environment variable.
 *
 * @param name - The name of the environment variable.
 * @returns The value of the environment variable, or undefined if it is not set and not required.
 * @throws {NotSet} If the environment variable is required but not set.
 *
 * @example
 * ```ts
 * import { getEnv } from "$/utils/env.ts";
 *
 * // Get a required environment variable
 * const apiKey = getEnv('API_KEY');
 * ```
 */
export function getEnv(name: string) {
  const env = Deno.env.get(name);
  if (!env) {
    throw new NotSet(name);
  }
  return env;
}
