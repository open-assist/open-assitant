import { z } from "zod";

export const ModelObject = z.object({
  id: z.string(),
  created: z.number().int().nullish(),
  object: z.enum(["model"]).default("model"),
  owned_by: z.string().default("openai"),
});
export type ModelObject = z.infer<typeof ModelObject>;

export const ListModelsResponse = z.object({
  object: z.enum(["list"]).default("list"),
  data: z.array(ModelObject),
});
export type ListModelsResponse = z.infer<typeof ListModelsResponse>;
