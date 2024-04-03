import { FreshContext, Handlers } from "$fresh/server.ts";
import { ModelObject } from "@open-schemas/zod/openai";
import { getProvider } from "$/utils/llm.ts";
import { getModels, getModelsMapping } from "$/utils/llm.ts";

export const handler: Handlers<ModelObject | null> = {
  GET(_req: Request, _ctx: FreshContext) {
    let models: ModelObject[];
    const modelsMapping = getModelsMapping();
    if (modelsMapping) {
      models = Object.keys(modelsMapping).map((id) => ModelObject.parse({ id }));
    } else {
      models = getModels().map((id) =>
        ModelObject.parse({
          id,
          owned_by: getProvider(),
        }),
      );
    }

    return Response.json({
      object: "list",
      data: models,
    });
  },
};
