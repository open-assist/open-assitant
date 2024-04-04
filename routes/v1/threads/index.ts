import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  CreateThreadRequest,
  Ordering,
  Pagination,
  ThreadObject,
} from "@open-schemas/zod/openai";
import { ThreadRepository } from "$/repositories/thread.ts";

export const handler: Handlers<ThreadObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await ThreadRepository.getInstance().findAllByPage(
      organization,
      Pagination.parse(params),
      Ordering.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields = req.body ? CreateThreadRequest.parse(await req.json()) : {};
    const organization = ctx.state.organization as string;

    const thread = await ThreadRepository.getInstance().createWithMessages(
      fields,
      organization,
    );

    return Response.json(thread, { status: 201 });
  },
};
