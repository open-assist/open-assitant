import { FreshContext, Handlers } from "$fresh/server.ts";
import { StepObject } from "@open-schemas/zod/openai";
import { StepRepository } from "$/repositories/step.ts";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";
import { getRun } from "$/routes/v1/threads/[thread_id]/runs/[run_id].ts";

export const handler: Handlers<StepObject | null> = {
  async GET(_req, ctx: FreshContext) {
    await getThread(ctx);
    const run = await getRun(ctx);

    const stepId = ctx.params.step_id;
    const step = await StepRepository.getInstance().findById(stepId, run.id);

    return Response.json(step);
  },
};
