import {
  AssistantToolsCode,
  AssistantToolsFunction,
  AssistantToolsRetrieval,
  CreateRunRequest,
  RunCompletionUsage,
  RunToolCallObject,
} from "openai_schemas";
import { FreshContext, Handlers } from "$fresh/server.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { RunRepository } from "$/repositories/run.ts";
import { z } from "zod";

const RunObject = z.object({
  id: z.string(),
  object: z.enum(["thread.run"]),
  created_at: z.number().int(),
  thread_id: z.string(),
  assistant_id: z.string(),
  status: z.enum([
    "queued",
    "in_progress",
    "requires_action",
    "cancelling",
    "cancelled",
    "failed",
    "completed",
    "expired",
  ]),
  required_action: z
    .object({
      type: z.enum(["submit_tool_outputs"]),
      submit_tool_outputs: z.object({ tool_calls: z.array(RunToolCallObject) }),
    })
    .nullable(),
  last_error: z.object({
    code: z.enum(["server_error", "rate_limit_exceeded"]),
    message: z.string(),
  }).nullable(),
  expires_at: z.number().int(),
  started_at: z.number().int().nullable(),
  cancelled_at: z.number().int().nullable(),
  failed_at: z.number().int().nullable(),
  completed_at: z.number().int().nullable(),
  model: z.string().nullable(),
  instructions: z.string().nullable(),
  tools: z
    .array(
      z.union([
        AssistantToolsCode,
        AssistantToolsRetrieval,
        AssistantToolsFunction,
      ]),
    )
    .max(20)
    .default([]).nullable(),
  file_ids: z.array(z.string()).default([]).nullable(),
  metadata: z.object({}).partial().nullable(),
  usage: RunCompletionUsage.nullable(),
});
type RunObjectType = z.infer<typeof RunObject>;

export const handler: Handlers<RunObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const threadId = ctx.params.thread_id as string;

    const page = await RunRepository.findAllByPage<RunObjectType>(
      threadId,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields = CreateRunRequest.parse(await req.json());
    const threadId = ctx.params.thread_id as string;

    const run = await RunRepository.create<RunObjectType>({
      ...fields,
      thread_id: threadId,
    }, threadId);

    return Response.json(run, { status: 201 });
  },
};
