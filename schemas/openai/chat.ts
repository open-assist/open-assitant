import { z } from "zod";

export type ChatCompletionObject = {
  id: string;
  choices: {
    finish_reason: string;
    index: number;
  }[];
  created: number;
  model: string;
  system_fingerprint: string;
  object: "chat.completion";
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
};

export const ChatCompletionFunctionToolCall = z.object({
  index: z.number().int(),
  id: z.string(),
  type: z.enum(["function"]).default("function"),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});
export type ChatCompletionFunctionToolCall = z.infer<
  typeof ChatCompletionFunctionToolCall
>;

export const ChatCompletionChunkChoice = z.object({
  delta: z
    .object({
      content: z.string().nullish().default(""),
      tool_calls: z.array(ChatCompletionFunctionToolCall).nullish(),
      role: z.enum(["assistant"]).default("assistant"),
    })
    .default({}),
  finish_reason: z.string().nullish().default(null),
  index: z.number().int().min(0).nullish(),
});

export const ChatCompletionChunkObject = z.object({
  id: z.string(),
  choices: z.array(ChatCompletionChunkChoice).default([]),
  created: z.number().int(),
  model: z.string(),
  system_fingerprint: z.string().nullish(),
  object: z.enum(["chat.completion.chunk"]).default("chat.completion.chunk"),
});
export type ChatCompletionChunkObject = z.infer<
  typeof ChatCompletionChunkObject
>;
