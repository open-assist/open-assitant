import z from "zod";

export type EmbeddingObject = z.infer<typeof EmbeddingObject>;
export const EmbeddingObject = z.object({
  obejct: z.literal("embedding").default("embedding"),
  embedding: z.array(z.number()),
  index: z.number(),
});

export type CreateEmbeddingRequest = z.infer<typeof CreateEmbeddingRequest>;
export const CreateEmbeddingRequest = z.object({
  input: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.number()),
    z.array(z.array(z.number())),
  ]),
  model: z.string(),
  encoding_format: z
    .union([z.literal("float"), z.literal("base64"), z.null()])
    .default("float")
    .optional(),
  dimensions: z.union([z.number(), z.null()]).optional(),
  user: z.union([z.string(), z.null()]).optional(),
});

export type CreateEmbeddingResponse = z.infer<typeof CreateEmbeddingResponse>;
export const CreateEmbeddingResponse = z.object({
  object: z.literal("list").default("list"),
  data: z.array(EmbeddingObject),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    total_tokens: z.number(),
  }),
});
