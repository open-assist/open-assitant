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
  role: z.union([z.literal("user"), z.literal("model")]).optional(),
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

export const FinishReason = z.enum([
  "FINISH_REASON_UNSPECIFIED",
  "STOP",
  "MAX_TOKENS",
  "SAFETY",
  "RECITATION",
  "OTHER",
]);
export type FinishReason = z.infer<typeof FinishReason>;

export const HarmCategory = z.enum([
  "HARM_CATEGORY_UNSPECIFIED",
  "HARM_CATEGORY_DEROGATORY",
  "HARM_CATEGORY_TOXICITY",
  "HARM_CATEGORY_VIOLENCE",
  "HARM_CATEGORY_SEXUAL",
  "HARM_CATEGORY_MEDICAL",
  "HARM_CATEGORY_DANGEROUS",
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
]);
export type HarmCategory = z.infer<typeof HarmCategory>;

export const HarmProbability = z.enum([
  "HARM_PROBABILITY_UNSPECIFIED",
  "NEGLIGIBLE",
  "LOW",
  "MEDIUM",
  "HIGH",
]);
export type HarmProbability = z.infer<typeof HarmProbability>;

export const SafetyRating = z.object({
  category: HarmCategory.nullish(),
  probability: HarmProbability.nullish(),
  blocked: z.boolean().nullish(),
});
export type SafetyRating = z.infer<typeof SafetyRating>;

export const CitationSource = z.object({
  startIndex: z.number().optional(),
  endIndex: z.number().optional(),
  uri: z.string().url().optional(),
  license: z.string().optional(),
});
export type CitationSource = z.infer<typeof CitationSource>;

export const CitationMetadata = z.object({
  citationSources: z.array(CitationSource),
});
export type CitationMetadata = z.infer<typeof CitationMetadata>;

export const Candidate = z.object({
  content: Content,
  finishReason: FinishReason.nullish(),
  safetyRatings: z.array(SafetyRating).nullish(),
  citationMetadata: CitationMetadata.nullish(),
  tokenCount: z.number().nullish(),
  index: z.number().nullish(),
});
export type Candidate = z.infer<typeof Candidate>;

export const BlockReason = z.enum([
  "BLOCK_REASON_UNSPECIFIED",
  "SAFETY",
  "OTHER",
]);
export type BlockReason = z.infer<typeof BlockReason>;

export const PromptFeedback = z.object({
  blockReason: BlockReason.nullish(),
  safetyRatings: z.array(SafetyRating).nullish(),
});
export type PromptFeedback = z.infer<typeof PromptFeedback>;

export const FunctionDeclaration = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.any().nullish(),
});
export type FunctionDeclaration = z.infer<typeof FunctionDeclaration>;

export const Tool = z.object({
  functionDeclarations: z.array(FunctionDeclaration),
});
export type Tool = z.infer<typeof Tool>;

export const HarmBlockThreshold = z.enum([
  "HARM_BLOCK_THRESHOLD_UNSPECIFIED",
  "BLOCK_LOW_AND_ABOVE",
  "BLOCK_MEDIUM_AND_ABOVE",
  "BLOCK_ONLY_HIGH",
  "BLOCK_NONE",
]);
export type HarmBlockThreshold = z.infer<typeof HarmBlockThreshold>;

export const SafetySetting = z.object({
  category: HarmCategory,
  threshold: HarmBlockThreshold,
});
export type SafetySetting = z.infer<typeof SafetySetting>;

export const GenerationConfig = z.object({
  stopSequences: z.array(z.string()).nullish(),
  candidateCount: z.number().int().nullish(),
  maxOutputTokens: z.number().int().nullish(),
  temperature: z.number().nullish(),
  topP: z.number().nullish(),
  topK: z.number().int().nullish(),
});
export type GenerationConfig = z.infer<typeof GenerationConfig>;

export type UsageMetadata = z.infer<typeof UsageMetadata>;
export const UsageMetadata = z.object({
  promptTokenCount: z.number(),
  candidatesTokenCount: z.number(),
  totalTokenCount: z.number(),
});

export const GenerateContentRequest = z.object({
  contents: z.array(Content),
  tools: z.array(Tool).nullish(),
  safetySettings: z.array(SafetySetting).nullish(),
  generationConfig: GenerationConfig.nullish(),
});
export type GenerateContentRequest = z.infer<typeof GenerateContentRequest>;

export const GenerateContentResponse = z.object({
  candidates: z.array(Candidate),
  promptFeedback: PromptFeedback.nullish(),
  usageMetadata: UsageMetadata,
});
export type GenerateContentResponse = z.infer<typeof GenerateContentResponse>;
