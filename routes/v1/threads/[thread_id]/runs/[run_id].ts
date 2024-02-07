import { FreshContext, Handlers } from "$fresh/server.ts";
import { RunRepository } from "$/repositories/run.ts";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";
import { type RunObjectType, ModifyRunRequest } from "openai_schemas";

export const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.run_id as string,
  threadId: ctx.params.thread_id as string,
});

export async function getRun(ctx: FreshContext) {
  const { id, threadId } = getIDs(ctx);
  return await RunRepository.findById<RunObjectType>(id, threadId);
}

export const handler: Handlers<RunObjectType | null> = {
  async GET(_req, ctx: FreshContext) {
    await getThread(ctx);
    return Response.json(await getRun(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const oldRun = await getRun(ctx);
    if (req.headers.get("content-length") === "0") {
      return Response.json(oldRun);
    }

    const fields = ModifyRunRequest.parse(await req.json());
    const newRun = await RunRepository.update<RunObjectType>(
      oldRun,
      fields,
      thread.id,
    );
    return Response.json(newRun);
  },
};
