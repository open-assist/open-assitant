import { CreateRunRequest, type RunObjectType } from "openai_schemas";
import { FreshContext, Handlers } from "$fresh/server.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { RunRepository } from "$/repositories/run.ts";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";

export const handler: Handlers<RunObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const params = Object.fromEntries(ctx.url.searchParams);

    const page = await RunRepository.findAllByPage<RunObjectType>(
      thread.id,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const fields = CreateRunRequest.parse(await req.json());

    const { value: run } = await RunRepository.create<RunObjectType>(
      {
        ...fields,
        thread_id: thread.id,
      },
      thread.id,
    );

    return Response.json(run, { status: 201 });
  },
};
