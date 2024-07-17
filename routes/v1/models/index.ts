import { FreshContext, Handlers } from "$fresh/server.ts";
import { ModelObject } from "$/schemas/openai/mod.ts";
import { getModelsMapping } from "$/utils/llm.ts";
import { preset } from "$/providers/models.ts";

export const handler: Handlers<ModelObject | null> = {
  GET(_req: Request, _ctx: FreshContext) {
    let models = preset;
    const modelsMapping = getModelsMapping();
    if (modelsMapping) {
      models = [
        ...models,
        ...Object.keys(modelsMapping).map((id) => ModelObject.parse({ id })),
      ];
    }

    return Response.json({
      object: "list",
      data: models,
    });
  },
};
