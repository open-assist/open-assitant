import z from "zod";

export type Part = z.infer<typeof Part>;
export const Part = z.union([
  z.object({
    text: z.string(),
  }),
  z.object({
    inlineData: z.object({
      mimeType: z.string(),
      data: z.string(),
    }),
  }),
]);

export type Content = z.infer<typeof Content>;
export const Content = z.object({
  parts: z.array(Part),
  role: z.union([z.literal("use"), z.literal("model")]).optional(),
});

export type TaskType = z.infer<typeof TaskType>;
export const TaskType = z.union([
  z.literal("TASK_TYPE_UNSPECIFIED"),
  z.literal("RETRIEVAL_QUERY"),
  z.literal("RETRIEVAL_DOCUMENT"),
  z.literal("SEMANTIC_SIMILARITY"),
  z.literal("CLASSIFICATION"),
  z.literal("CLUSTERING"),
  z.literal("QUESTION_ANSWERING"),
  z.literal("FACT_VERIFICATION"),
]);

export type EmbedContentRequest = z.infer<typeof EmbedContentRequest>;
export const EmbedContentRequest = z.object({
  content: Content,
  taskType: TaskType.optional(),
  title: z.string().optional(),
  outputDimensionality: z.union([z.number(), z.null()]).optional(),
});

export type ContentEmbedding = z.infer<typeof ContentEmbedding>;
export const ContentEmbedding = z.object({
  values: z.array(z.number()),
});

export type EmbedContentResponse = z.infer<typeof EmbedContentResponse>;
export const EmbedContentResponse = z.object({
  embedding: ContentEmbedding,
});
