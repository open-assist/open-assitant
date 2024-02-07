import { FreshContext, Handlers } from "$fresh/server.ts";
import { StepRepository } from "$/repositories/step.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";
import { getRun } from "$/routes/v1/threads/[thread_id]/runs/[run_id].ts";
import type { RunStepObjectType } from "openai_schemas";

export const handler: Handlers<RunStepObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    await getThread(ctx);
    const run = await getRun(ctx);

    const params = Object.fromEntries(ctx.url.searchParams);
    const page = await StepRepository.findAllByPage<RunStepObjectType>(
      run.id,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },
};
