import { CreateRunRequest, RunObject } from "@open-schemas/zod/openai";
import { FreshContext, Handlers } from "$fresh/server.ts";
import { pagableSchema, sortSchema } from "$/repositories/base.ts";
import { RunRepository } from "$/repositories/run.ts";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";

export const handler: Handlers<RunObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const params = Object.fromEntries(ctx.url.searchParams);

    const page = await RunRepository.getInstance().findAllByPage(
      thread.id,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const fields = CreateRunRequest.parse(await req.json());

    const run = await RunRepository.getInstance().createAndEnqueue(
      {
        ...fields,
        thread_id: thread.id,
      },
      thread.id,
    );

    return Response.json(run, { status: 201 });
  },
};
