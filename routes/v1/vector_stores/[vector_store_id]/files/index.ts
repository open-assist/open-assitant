import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  CreateVectorStoreFileRequest,
  Ordering,
  Pagination,
  VectorStoreFileObject,
} from "$/schemas/openai/mod.ts";
import { VectorStoreFileRepository } from "$/repositories/vector_store_file.ts";
import { getVectorStore } from "$/routes/v1/vector_stores/[vector_store_id].ts";

export const handler: Handlers<VectorStoreFileObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    // const organization = ctx.state.organization as string;
    const vectorStoreId = ctx.params.vector_store_id as string;

    const page = await VectorStoreFileRepository.getInstance().findAllByPage(
      vectorStoreId,
      Pagination.parse(params),
      Ordering.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields = CreateVectorStoreFileRequest.parse(await req.json());
    const vectorStore = await getVectorStore(ctx);
    const organization = ctx.state.organization as string;

    const vectorStoreFile = await VectorStoreFileRepository.getInstance()
      .createByFileIdWithJob(
        fields.file_id,
        vectorStore,
        organization,
        fields.chunking_strategy,
      );

    return Response.json(vectorStoreFile, { status: 201 });
  },
};
