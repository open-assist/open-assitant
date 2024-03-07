import { z } from "zod";

export const metaSchema = z.object({
  id: z.string({
    description: "The identifier, which can be referenced in API endpoints.",
  }),
  created_at: z.number(),
  object: z.string(),
});

export type Meta = z.infer<typeof metaSchema>;
