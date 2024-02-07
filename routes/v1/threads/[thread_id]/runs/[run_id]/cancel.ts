import { FreshContext, Handlers } from "$fresh/server.ts";
import { UnprocessableContent } from "$/utils/errors.ts";
import { getRun } from "$/routes/v1/threads/[thread_id]/runs/[run_id].ts";
import { RunRepository } from "$/repositories/run.ts";
import { type RunObjectType } from "openai_schemas";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";

export const handler: Handlers<RunObjectType | null> = {
  async POST(_req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const run = await getRun(ctx);
    if (
      run.status === "cancelling" ||
      run.status === "cancelled" ||
      run.status === "completed" ||
      run.status === "failed" ||
      run.status === "expired"
    ) {
      throw new UnprocessableContent(`The run was already ${run.status}.`);
    }

    const newRun = await RunRepository.cancel(run, thread.id);

    return Response.json(newRun, {
      status: 202,
      headers: { Location: `/v1/threads/${thread.id}/runs/${run.id}` },
    });
  },
};
