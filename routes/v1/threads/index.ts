import { FreshContext, Handlers } from "$fresh/server.ts";
import { CreateThreadRequest, type ThreadObjectType } from "openai_schemas";
import { ThreadRepository } from "$/repositories/thread.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";

export const handler: Handlers<ThreadObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await ThreadRepository.findAllByPage<ThreadObjectType>(
      organization,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields =
      req.headers.get("content-length") === "0"
        ? { metadata: {} }
        : CreateThreadRequest.parse(await req.json());
    const organization = ctx.state.organization as string;

    const { value } = await ThreadRepository.createWithMessages(
      fields,
      organization,
    );

    return Response.json(value, { status: 201 });
  },
};
