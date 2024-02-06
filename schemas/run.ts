import { z } from "zod";
import {
  functionToolCallType,
  metadata,
  metaSchema,
  statusFieldsType,
} from "$/schemas/_base.ts";

export const errorType = z
  .object({
    code: z.enum(["server_error", "rate_limit_exceeded"]),
    message: z.string(),
  })
  .optional();

export const statusTimesSchema = z.object({
  expired_at: z.number().optional(),
  cancelled_at: z.number().optional(),
  failed_at: z.number().optional(),
  completed_at: z.number().optional(),
});

/**
 * The request body, which creating a run.
 */
export const runSchema = z.object({
  assistant_id: z.string({
    description: "The ID of the assistant to use to execute this run.",
  }),
  model: z
    .string({
      description:
        "The ID of the Model to be used to execute this run. If a value is provided here, it will override the model associated with the assistant. If not, the model associated with the assistant will be used.",
    })
    .optional(),
  instructions: z
    .string({
      description:
        "Overrides the instructions of the assistant. This is useful for modifying the behavior on a per-run basis.",
    })
    .optional(),
  additional_instructions: z
    .string({
      description:
        "Appends additional instructions at the end of the instructions for the run. This is useful for modifying the behavior on a per-run basis without overriding other instructions.",
    })
    .optional(),
  metadata,
});

const runType = runSchema
  .omit({
    additional_instructions: true,
  })
  .merge(
    z.object({
      thread_id: z.string({
        description: "The thread ID that this message belongs to.",
      }),
      status: z.enum(
        [
          "queued",
          "in_progress",
          "requires_action",
          "cancelling",
          "cancelled",
          "failed",
          "completed",
          "expired",
        ],
        {
          description: "The status of the run.",
        },
      ),
      required_action: z
        .object({
          type: z.enum(["submit_tool_outputs"]),
          submit_tool_outputs: z.object({
            tool_calls: z.array(functionToolCallType),
          }),
        })
        .optional(),
      started_at: z.number().optional(),
      expires_at: z.number(),
    }),
  )
  .merge(statusFieldsType.omit({ status: true, expired_at: true }))
  .merge(metaSchema);

const toolOutputType = z.object({
  tool_call_id: z.string().optional(),
  output: z.string().optional(),
});
export type ToolOutput = z.infer<typeof toolOutputType>;

export const toolOutputsSchema = z.object({
  tool_outputs: z.array(toolOutputType),
});

/**
 * Represents an execution run on a thread.
 */
export type Run = z.infer<typeof runType>;
