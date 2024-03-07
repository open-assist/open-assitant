import { FreshContext, Handlers } from "$fresh/server.ts";
import { MODELS, MODELS_MAPPING } from "$/utils/model.ts";
import type { ModelType } from "openai_schemas";
import { getProvider } from "$/utils/provider.ts";

export const handler: Handlers<ModelType | null> = {
  GET(_req: Request, _ctx: FreshContext) {
    let models: Partial<ModelType>[];
    if (MODELS_MAPPING) {
      models = Object.keys(MODELS_MAPPING).map(
        (m) =>
          ({
            object: "model",
            id: m,
            owned_by: "openai",
          }) as ModelType,
      );
    } else {
      models = MODELS.map(
        (m) =>
          ({
            object: "model",
            id: m,
            owned_by: getProvider(),
          }) as ModelType,
      );
    }

    return Response.json({
      object: "list",
      data: models,
    });
  },
};
