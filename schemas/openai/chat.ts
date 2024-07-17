import z from "zod";
import { Usage } from "./assistants.ts";

export type ChatCompletionRequestSystemMessage = z.infer<
  typeof ChatCompletionRequestSystemMessage
>;
export const ChatCompletionRequestSystemMessage = z.object({
  content: z.string(),
  role: z.literal("system").default("system"),
  name: z.string().optional(),
});

export type ChatCompletionRequestMessageTextContentPart = z.infer<
  typeof ChatCompletionRequestMessageTextContentPart
>;
export const ChatCompletionRequestMessageTextContentPart = z.object({
  type: z.literal("text").default("text"),
  text: z.string(),
});

export type ChatCompletionRequestMessageImageContentPart = z.infer<
  typeof ChatCompletionRequestMessageImageContentPart
>;
export const ChatCompletionRequestMessageImageContentPart = z.object({
  type: z.literal("image_url").default("image_url"),
  image_url: z.object({
    url: z.string(),
    detail: z
      .union([z.literal("auto"), z.literal("low"), z.literal("hight")])
      .optional(),
  }),
});

export type ChatCompletionRequestMessageContentPart = z.infer<
  typeof ChatCompletionRequestMessageContentPart
>;
export const ChatCompletionRequestMessageContentPart = z.union([
  ChatCompletionRequestMessageTextContentPart,
  ChatCompletionRequestMessageImageContentPart,
]);

export type ChatCompletionRequestUserMessage = z.infer<
  typeof ChatCompletionRequestUserMessage
>;
export const ChatCompletionRequestUserMessage = z.object({
  content: z.union([
    z.string(),
    z.array(ChatCompletionRequestMessageContentPart),
  ]),
  role: z.literal("user").default("user"),
  name: z.string().optional(),
});

export type ChatCompletionMessageToolCall = z.infer<
  typeof ChatCompletionMessageToolCall
>;
export const ChatCompletionMessageToolCall = z.object({
  id: z.string(),
  type: z.literal("function").default("function"),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

export type ChatCompletionRequestAssistantMessage = z.infer<
  typeof ChatCompletionRequestAssistantMessage
>;
export const ChatCompletionRequestAssistantMessage = z.object({
  content: z.string().optional(),
  role: z.literal("assistant").default("assistant"),
  name: z.string().optional(),
  tool_calls: z.array(ChatCompletionMessageToolCall).optional(),
});

export type ChatCompletionRequestToolMessage = z.infer<
  typeof ChatCompletionRequestToolMessage
>;
export const ChatCompletionRequestToolMessage = z.object({
  role: z.literal("tool").default("tool"),
  content: z.string(),
  tool_call_id: z.string(),
});

export type ChatCompletionRequestMessage = z.infer<
  typeof ChatCompletionRequestMessage
>;
export const ChatCompletionRequestMessage = z.union([
  ChatCompletionRequestSystemMessage,
  ChatCompletionRequestUserMessage,
  ChatCompletionRequestAssistantMessage,
  ChatCompletionRequestToolMessage,
]);

export type ChatCompletionTool = z.infer<typeof ChatCompletionTool>;
export const ChatCompletionTool = z.object({
  type: z.literal("function").default("function"),
  function: z.object({
    name: z.string(),
    description: z.string().optional(),
    parameters: z.any().optional(),
  }),
});

export type CreateChatCompletionRequest = z.infer<
  typeof CreateChatCompletionRequest
>;
export const CreateChatCompletionRequest = z.object({
  messages: z.array(ChatCompletionRequestMessage),
  model: z.string(),
  frequency_penalty: z.number().min(-2).max(2).default(0).optional(),
  logit_bias: z.record(z.number()).optional(),
  logprobs: z.boolean().optional(),
  top_logprobs: z.number().min(0).max(20).optional(),
  max_tokens: z.number().optional(),
  n: z.number().default(1).optional(),
  presence_penalty: z.number().min(-2).max(2).default(0).optional(),
  response_format: z
    .object({
      type: z
        .union([z.literal("text"), z.literal("json_object")])
        .default("text"),
    })
    .default({ type: "text" })
    .optional(),
  seed: z.union([z.number(), z.null()]).optional(),
  service_tier: z.union([z.string(), z.null()]).optional(),
  stop: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  stream: z.boolean().default(false).optional(),
  stream_options: z
    .union([
      z.object({
        include_usage: z.boolean().optional(),
      }),
      z.null(),
    ])
    .optional(),
  temperature: z.number().min(0).max(2).default(1).optional(),
  top_p: z.number().default(1).optional(),
  tools: z.array(ChatCompletionTool).optional(),
  tool_choice: z
    .union([
      z.literal("none"),
      z.literal("auto"),
      z.literal("required"),
      z.object({
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
        }),
      }),
    ])
    .optional(),
  parallel_tool_calls: z.boolean().default(true).optional(),
  user: z.string().optional(),
});

export type ChatCompletionToolCall = z.infer<typeof ChatCompletionToolCall>;
export const ChatCompletionToolCall = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

export type FinishReason = z.infer<typeof FinishReason>;
export const FinishReason = z.union([
  z.literal("stop"),
  z.literal("length"),
  z.literal("content_filter"),
  z.literal("tool_calls"),
]);

export type ChatCompletionLogprobs = z.infer<typeof ChatCompletionLogprobs>;
export const ChatCompletionLogprobs = z.object({
  content: z
    .array(
      z.object({
        token: z.string(),
        logprob: z.number(),
        bytes: z.array(z.number()).optional(),
        top_logprobs: z.object({
          token: z.string(),
          logprob: z.number(),
          bytes: z.array(z.number()).optional(),
        }),
      }),
    )
    .optional(),
});

export type ChatCompletionChoiceContent = z.infer<
  typeof ChatCompletionChoiceContent
>;
export const ChatCompletionChoiceContent = z.object({
  content: z.string().optional(),
  tool_calls: z.array(ChatCompletionToolCall).optional(),
  role: z.literal("assistant").default("assistant"),
});

export type ChatCompletionChoice = z.infer<typeof ChatCompletionChoice>;
export const ChatCompletionChoice = z.object({
  finish_reason: FinishReason,
  index: z.number().min(0),
  message: ChatCompletionChoiceContent,
  logprobs: ChatCompletionLogprobs.optional(),
});

export type ChatCompletionObject = z.infer<typeof ChatCompletionObject>;
export const ChatCompletionObject = z.object({
  id: z.string(),
  choices: z.array(ChatCompletionChoice),
  created: z.number(),
  model: z.string(),
  service_tier: z.union([z.string(), z.null()]).optional(),
  system_fingerprint: z.string().optional(),
  object: z.literal("chat.completion").default("chat.completion"),
  usage: Usage,
});

export type ChatCompletionChunkChoice = z.infer<
  typeof ChatCompletionChunkChoice
>;
export const ChatCompletionChunkChoice = z.object({
  delta: ChatCompletionChoiceContent,
  logprobs: ChatCompletionLogprobs.optional(),
  finish_reason: FinishReason.optional(),
  index: z.number().min(0),
});

export type ChatCompletionChunkObject = z.infer<
  typeof ChatCompletionChunkObject
>;
export const ChatCompletionChunkObject = z.object({
  id: z.string(),
  choices: z.array(ChatCompletionChunkChoice),
  created: z.number(),
  model: z.string(),
  system_fingerprint: z.string(),
  object: z.literal("chat.completion.chunk").default("chat.completion.chunk"),
  usage: Usage.optional(),
});
