import { FreshContext, Handlers } from "$fresh/server.ts";
import type { Model } from "$/schemas/model.ts";

export const handler: Handlers<Model | null> = {
  GET(_req: Request, _ctx: FreshContext) {
    const models: Model[] = [
      {
        id: "gemini-pro",
        object: "model",
        owned_by: "google",
      },
      {
        id: "gemini-pro-vision",
        object: "model",
        owned_by: "google",
      },
    ];

    return Response.json({
      object: "list",
      data: models,
    });
  },
};
