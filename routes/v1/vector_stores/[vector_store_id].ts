import { FreshContext, Handlers } from "$fresh/server.ts";
import { VectorStoreObject } from "$open-schemas/types/openai/mod.ts";
import {
  DeleteVectorStoreResponse,
  ModifyVectorStoreRequest,
} from "$open-schemas/zod/openai/mod.ts";
import { VectorStoreRepository } from "$/repositories/vector_store.ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.vector_store_id as string,
  parentId: ctx.state.organization as string,
});

export async function getVectorStore(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return await VectorStoreRepository.getInstance().findById(id, parentId);
}

export const handler: Handlers<VectorStoreObject | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getVectorStore(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldVectorStore = await getVectorStore(ctx);
    const organization = ctx.state.organization as string;
    if (req.body) {
      const fields = ModifyVectorStoreRequest.parse(await req.json());
      const newVectorStore = await VectorStoreRepository.getInstance().update(
        oldVectorStore,
        fields,
        organization,
      );
      return Response.json(newVectorStore);
    }
    return Response.json(oldVectorStore);
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    await getVectorStore(ctx);
    const { id, parentId } = getIDs(ctx);

    await VectorStoreRepository.getInstance().destory(id, parentId);

    return Response.json(DeleteVectorStoreResponse.parse({ id }));
  },
};
