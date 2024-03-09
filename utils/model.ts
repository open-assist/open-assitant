const models = Deno.env.get("MODELS");
export const MODELS: string[] =
  models && models.length > 0 ? models.split(",") : [];

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

const models_mapping = Deno.env.get("MODELS_MAPPING");
export const MODELS_MAPPING: object | undefined =
  models_mapping && models_mapping.length > 0
    ? models_mapping.split(",").reduce(mapModels, {})
    : undefined;
