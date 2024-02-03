import { FreshContext, Handlers } from "$fresh/server.ts";
import { RunRepository } from "$/repositories/run.ts";
import { type Run, runSchema } from "$/schemas/run.ts";

export const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.run_id as string,
  threadId: ctx.params.thread_id as string,
  organization: ctx.state.organization as string,
});

export async function getRun(ctx: FreshContext) {
  const { id, threadId } = getIDs(ctx);

  return (await RunRepository.findById(
    id,
    threadId,
  )) as Run;
}

export const handler: Handlers<Run | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getRun(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldRun = await getRun(ctx);
    const { threadId } = getIDs(ctx);
    const fields = runSchema.pick({ metadata: true }).parse(
      await req.json(),
    );

    const newRun = await RunRepository.update<Run>(
      oldRun,
      fields,
      threadId,
    );
    return Response.json(newRun);
  },
};
