import { FreshContext, Handlers } from "$fresh/server.ts";
import { UnprocessableContent } from "$/utils/errors.ts";
import { getIDs, getRun } from "../[run_id].ts";
import { RunRepository } from "$/repositories/run.ts";
import { type Run } from "$/schemas/run.ts";

export const handler: Handlers<Run | null> = {
  async POST(_req: Request, ctx: FreshContext) {
    const run = await getRun(ctx);
    if (
      run.status === "cancelling" || run.status === "cancelled" ||
      run.status === "completed" || run.status === "failed" ||
      run.status === "expired"
    ) {
      throw new UnprocessableContent(
        `The run was already ${run.status}.`,
      );
    }
    const { threadId } = getIDs(ctx);

    const newRun = await RunRepository.cancel(run, threadId);

    return Response.json(newRun, {
      status: 202,
      headers: { "Location": `/v1/threads/${run.thread_id}/runs/${run.id}` },
    });
  },
};
