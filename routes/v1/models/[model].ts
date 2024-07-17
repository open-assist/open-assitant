import { FreshContext, Handlers } from "$fresh/server.ts";
import { ModelObject } from "$/schemas/openai/mod.ts";
import { getModelsMapping } from "$/utils/llm.ts";
import { preset } from "$/providers/models.ts";
import { NotFound } from "$/utils/errors.ts";

export const handler: Handlers<ModelObject | null> = {
  GET(_req: Request, ctx: FreshContext) {
    const id = ctx.params.model as string;

    let model;
    const modelsMapping = getModelsMapping();
    if (modelsMapping && Object.hasOwn(modelsMapping, id)) {
      model = ModelObject.parse({ id });
    } else {
      model = preset.find((m) => m.id === id);
    }

    if (model) {
      return Response.json(model);
    } else {
      throw new NotFound({ instance: `/models/${id}` });
    }
  },
};
