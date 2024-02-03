import { z } from "zod";
import { metaSchema } from "$/schemas/_base.ts";

export const tokenSchema = z.object({
  name: z.string(),
});

export const tokenType = tokenSchema.merge(z.object({
  content: z.string(),
  created_at: z.number(),
})).merge(metaSchema);

export type Token = z.infer<typeof tokenType>;
