import { FreshContext, Handlers } from "$fresh/server.ts";
import { type Step } from "$/schemas/step.ts";
import { StepRepository } from "$/repositories/step.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";

export const handler: Handlers<Step | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const runId = ctx.params.run_id as string;

    const page = await StepRepository.findAllByPage<Step>(
      runId,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },
};
