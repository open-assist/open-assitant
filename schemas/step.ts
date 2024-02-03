import { z } from "zod";
import { metadata, metaSchema, statusFieldsType } from "$/schemas/_base.ts";

const messageCreationType = z.object({
  type: z.enum(["message_creation"]),
  message_creation: z.object({
    message_id: z.string(),
  }),
});

const functionToolCallType = z.object({
  id: z.string(),
  type: z.enum(["function"]),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
    output: z.string().optional(),
  }),
});
export type FunctionToolCall = z.infer<typeof functionToolCallType>;

const toolCallsType = z.object({
  type: z.enum(["tool_calls"]),
  tool_calls: z.array(functionToolCallType),
});

export type ToolCalls = z.infer<typeof toolCallsType>;

const stepType = z.object({
  assistant_id: z.string(),
  thread_id: z.string(),
  run_id: z.string(),
  type: z.enum(["message_creation", "tool_calls"]),
  step_details: z.union([
    messageCreationType,
    toolCallsType,
  ]),
  metadata,
}).merge(statusFieldsType)
  .merge(metaSchema);

export type Step = z.infer<typeof stepType>;
