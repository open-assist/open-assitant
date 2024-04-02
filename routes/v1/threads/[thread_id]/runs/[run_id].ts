import { FreshContext, Handlers } from "$fresh/server.ts";
import { RunRepository } from "$/repositories/run.ts";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";
import { RunObject, ModifyRunRequest } from "@open-schemas/zod/openai";

export const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.run_id as string,
  threadId: ctx.params.thread_id as string,
});

export async function getRun(ctx: FreshContext) {
  const { id, threadId } = getIDs(ctx);
  return await RunRepository.getInstance().findById(id, threadId);
}

export const handler: Handlers<RunObject | null> = {
  async GET(_req, ctx: FreshContext) {
    await getThread(ctx);
    return Response.json(await getRun(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const oldRun = await getRun(ctx);
    if (req.body) {
      const fields = ModifyRunRequest.parse(await req.json());
      const newRun = await RunRepository.getInstance().update(oldRun, fields, thread.id);
      return Response.json(newRun);
    } else {
      return Response.json(oldRun);
    }
  },
};
