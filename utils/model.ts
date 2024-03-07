import { env } from "$/fresh.config.ts";

export const MODELS: string[] =
  env["MODELS"] && env["MODELS"].length > 0 ? env["MODELS"].split(",") : [];

function mapModels(pre: object, cur: string) {
  const parts = cur.split(":");
  if (parts.length !== 2) {
    return pre;
  }

  return {
    ...pre,
    [parts[0]]: parts[1],
  };
}
export const MODELS_MAPPING: object | undefined =
  env["MODELS_MAPPING"] && env["MODELS_MAPPING"].length > 0
    ? env["MODELS_MAPPING"].split(",").reduce(mapModels, {})
    : undefined;
