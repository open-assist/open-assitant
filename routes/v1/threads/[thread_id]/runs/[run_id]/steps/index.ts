import { FreshContext, Handlers } from "$fresh/server.ts";
import { StepObject } from "@open-schemas/zod/openai";
import { StepRepository } from "$/repositories/step.ts";
import { pagableSchema, sortSchema } from "$/repositories/base.ts";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";
import { getRun } from "$/routes/v1/threads/[thread_id]/runs/[run_id].ts";

export const handler: Handlers<StepObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    await getThread(ctx);
    const run = await getRun(ctx);

    const params = Object.fromEntries(ctx.url.searchParams);
    const page = await StepRepository.getInstance().findAllByPage(
      run.id,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },
};
