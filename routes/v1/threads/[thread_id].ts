import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  ModifyThreadRequest,
  DeleteThreadResponse,
  type ThreadObjectType,
} from "openai_schemas";
import { ThreadRepository } from "$/repositories/thread.ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.thread_id as string,
  parentId: ctx.state.organization as string,
});

export async function getThread(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return await ThreadRepository.findById<ThreadObjectType>(id, parentId);
}

export const handler: Handlers<ThreadObjectType | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getThread(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldThread = await getThread(ctx);
    if (req.headers.get("content-length") === "0") {
      return Response.json(oldThread);
    }

    const organization = ctx.state.organization as string;
    const fields = ModifyThreadRequest.parse(await req.json());
    const newThread = await ThreadRepository.update<ThreadObjectType>(
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

    return Response.json(DeleteThreadResponse.parse({ id }));
  },
};
