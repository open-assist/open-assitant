import { LLM_PROVIDER, LLM_MODELS, LLM_MODELS_MAPPING } from "$/consts/envs.ts";
import { EnvNotSet } from "$/utils/errors.ts";

/**
 * Retrieves the provider from the environment variable.
 *
 * @example
 * ```ts
 * import { getProvider } from "$/utils/llm.ts";
 *
 * const provider = getProvider();
 * console.log(provider); // output: 'openai'
 * ```
 *
 * @throws {EnvNotSet} If the environment variable is not set.
 * @returns The provider string.
 */
export function getProvider() {
  const provider = Deno.env.get(LLM_PROVIDER);
  if (!provider) {
    throw new EnvNotSet(LLM_PROVIDER);
  }
  return provider;
}

/**
 * Retrieves the list of available models from the environment variable.
 *
 * @example
 * ```ts
 * import { getModels } from "$/utils/llm.ts";
 *
 * getModels(); // output: ['model1', 'model2', ...]
 * ```
 *
 * @throws {EnvNotSet} If the environment variable is not set.
 * @returns The list of available models.
 */
export function getModels() {
  const models = Deno.env.get(LLM_MODELS);
  if (!models) throw new EnvNotSet(LLM_MODELS);

  return models.split(",");
}

/**
 * Maps the model mapping string to an object.
 *
 * @param pre The accumulator object to store the mapped models.
 * @param cur The current model mapping string in the format 'modelName->modelPath'.
 * @returns The updated accumulator object with the mapped model.
 */
function mapModels(pre: object, cur: string) {
  const parts = cur.split("->");
  if (parts.length !== 2) {
    return pre;
  }

  return {
    ...pre,
    [parts[0]]: parts[1],
  };
}

/**
 * Retrieves the model mapping from the environment variable.
 *
 * @example
 * ```ts
 * import { getModelsMapping } from "$/utils/llm.ts";
 *
 * const modelsMapping = getModelsMapping();
 * console.log(modelsMapping); // output: { model1: 'new_model1', model2: 'new_model2', ... }
 * ```
 *
 * @returns An object containing the mapped models, or undefined if the environment variable is not set.
 */
export function getModelsMapping() {
  const models_mapping = Deno.env.get(LLM_MODELS_MAPPING);
  if (!models_mapping) return undefined;

  return models_mapping.split(",").reduce(mapModels, {});
}

async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

/**
 * Generates a unique fingerprint based on the available models.
 *
 * @example
 * ```ts
 * import { genSystemFingerprint } from "$/utils/llm.ts";
 *
 * const fingerprint = await genSystemFingerprint();
 * console.log(fingerprint); // output: 'fp_a1b2c3d4e5'
 * ```
 *
 * @returns A promise that resolves to the generated fingerprint.
 */
export async function genSystemFingerprint() {
  const hash = await digestMessage(`${getModels()}`);
  return `fp_${hash.slice(0, 10)}`;
}
