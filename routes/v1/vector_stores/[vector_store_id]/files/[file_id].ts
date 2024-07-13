import { FreshContext, Handlers } from "$fresh/server.ts";
import type { VectorStoreFileObject } from "$open-schemas/types/openai/mod.ts";
import { DeleteVectorStoreFileResponse } from "$open-schemas/zod/openai/mod.ts";
import { VectorStoreFileRepository } from "$/repositories/vector_store_file.ts";
import { getVectorStore } from "$/routes/v1/vector_stores/[vector_store_id].ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.file_id as string,
  parentId: ctx.params.vector_store_id as string,
});

export async function getVectorStoreFile(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return await VectorStoreFileRepository.getInstance().findById(id, parentId);
}

export const handler: Handlers<VectorStoreFileObject | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getVectorStoreFile(ctx));
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    const vs = await getVectorStore(ctx);
    const vsf = await getVectorStoreFile(ctx);
    const organization = ctx.state.organization as string;

    await VectorStoreFileRepository.getInstance().destoryByObject(
      vs,
      vsf,
      organization,
    );

    return Response.json(DeleteVectorStoreFileResponse.parse({ id: vsf.id }));
  },
};
