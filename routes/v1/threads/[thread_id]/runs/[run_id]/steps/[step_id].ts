import { FreshContext, Handlers } from "$fresh/server.ts";
import { type Step } from "$/schemas/step.ts";
import { StepRepository } from "$/repositories/step.ts";

export const handler: Handlers<Step | null> = {
  async GET(_req, ctx: FreshContext) {
    const runId = ctx.params.run_id;
    const stepId = ctx.params.step_id;

    const step = await StepRepository.findById<Step>(
      stepId,
      runId,
    );

    return Response.json(step);
  },
};
