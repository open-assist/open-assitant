import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  type Thread,
  ThreadRepository,
  threadSchema,
} from "$/repositories/thread.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";

export const handler: Handlers<Thread | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await ThreadRepository.findAllByPage<Thread>(
      organization,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields = threadSchema.parse(await req.json()) as Thread;
    const organization = ctx.state.organization as string;

    const thread = await ThreadRepository.create(fields, organization);

    return Response.json(thread, { status: 201 });
  },
};
