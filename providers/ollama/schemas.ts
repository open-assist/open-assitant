import { z } from "zod";

export const ChatMessage = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  images: z.array(z.string()).nullish(),
});
export type ChatMessageType = z.infer<typeof ChatMessage>;

export const ChatRequest = z.object({
  model: z.string(),
  messages: z.array(ChatMessage).min(1),
  format: z.enum(["json"]).nullish(),
  options: z.any().nullish(),
  template: z.string().nullish(),
  stream: z.boolean().nullish(),
  keep_alive: z.string().default("5m").nullish(),
});
export type ChatRequestType = z.infer<typeof ChatRequest>;

export const ChatResponse = z.object({
  model: z.string(),
  created_at: z.string().datetime(),
  message: ChatMessage.optional(),
  done: z.boolean(),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});
export type ChatResponseType = z.infer<typeof ChatResponse>;

// export const ChatResponseDelta = ChatResponse.pick({
//   model: true,
//   created_at: true,
//   message: true,
//   done: true,
// });
// export type ChatResponseDeltaType = z.infer<typeof ChatResponseDelta>;

// export const ChatResponseStop = ChatResponse.omit({ message: true });
// export type ChatResponseStopType = z.infer<typeof ChatResponseStop>;
