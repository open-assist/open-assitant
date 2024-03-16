import { FreshContext, Handlers } from "$fresh/server.ts";
import { FileRepository } from "$/repositories/file.ts";
import { DeleteFileResponse } from "openai_schemas";
import type { FileObjectType } from "$/schemas/file.ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.file_id as string,
  parentId: ctx.state.organization as string,
});

async function getFile(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return await FileRepository.findById<FileObjectType>(id, parentId);
}

export const handler: Handlers<FileObjectType | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getFile(ctx));
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    await getFile(ctx);
    const { id, parentId } = getIDs(ctx);

    await FileRepository.destory(id, parentId);
    return Response.json(DeleteFileResponse.parse({ id }));
  },
};
