import { FreshContext, Handlers } from "$fresh/server.ts";
import { ModifyThreadRequest, DeleteThreadResponse, ThreadObject } from "@open-schemas/zod/openai";
import { ThreadRepository } from "$/repositories/thread.ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.thread_id as string,
  parentId: ctx.state.organization as string,
});

export async function getThread(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return await ThreadRepository.getInstance().findById(id, parentId);
}

export const handler: Handlers<ThreadObject | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getThread(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldThread = await getThread(ctx);
    const organization = ctx.state.organization as string;
    if (req.body) {
      const fields = ModifyThreadRequest.parse(await req.json());
      const newThread = await ThreadRepository.getInstance().update(
        oldThread,
        fields,
        organization,
      );
      return Response.json(newThread);
    }
    return Response.json(oldThread);
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    await getThread(ctx);
    const { id, parentId } = getIDs(ctx);

    await ThreadRepository.getInstance().destory(id, parentId);

    return Response.json(DeleteThreadResponse.parse({ id }));
  },
};
