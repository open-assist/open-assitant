import { FreshContext, Handlers } from "$fresh/server.ts";
import { FileRepository } from "$/repositories/file.ts";
import { FileObject, DeleteFileResponse } from "@open-schemas/zod/openai";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.file_id as string,
  parentId: ctx.state.organization as string,
});

export async function getFile(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return await FileRepository.getInstance().findById(id, parentId);
}

export const handler: Handlers<FileObject | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getFile(ctx));
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    await getFile(ctx);
    const { id, parentId } = getIDs(ctx);

    await FileRepository.getInstance().destoryWithFile(id, parentId);
    return Response.json(DeleteFileResponse.parse({ id }));
  },
};
