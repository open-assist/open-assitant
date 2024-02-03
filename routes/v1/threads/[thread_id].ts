import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  type Thread,
  ThreadRepository,
  threadSchema,
} from "$/repositories/thread.ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.thread_id as string,
  parentId: ctx.state.organization as string,
});

async function getThread(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return (await ThreadRepository.findById(
    id,
    parentId,
  )) as Thread;
}

export const handler: Handlers<Thread | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getThread(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldThread = await getThread(ctx);
    const organization = ctx.state.organization as string;
    const fields = threadSchema.pick({ metadata: true }).parse(
      await req.json(),
    );

    const newThread = await ThreadRepository.update<Thread>(
      oldThread,
      fields,
      organization,
    );
    return Response.json(newThread);
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    await getThread(ctx);
    const { id, parentId } = getIDs(ctx);

    await ThreadRepository.destory(id, parentId);

    return new Response(undefined, { status: 204 });
  },
};
