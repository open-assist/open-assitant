import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  CreateVectorStoreRequest,
  Ordering,
  Pagination,
  type VectorStoreObject,
} from "$/schemas/openai/mod.ts";
import { VectorStoreRepository } from "$/repositories/vector_store.ts";

export const handler: Handlers<VectorStoreObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await VectorStoreRepository.getInstance().findAllByPage(
      organization,
      Pagination.parse(params),
      Ordering.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields = req.body
      ? CreateVectorStoreRequest.parse(await req.json())
      : {};
    const organization = ctx.state.organization as string;

    const vectorStore = await VectorStoreRepository.getInstance()
      .createWithFiles(
        fields,
        organization,
      );

    return Response.json(vectorStore, { status: 201 });
  },
};
