import { FreshContext, Handlers } from "$fresh/server.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { MessageRepository } from "$/repositories/message.ts";
import { CreateMessageRequest, type MessageObjectType } from "openai_schemas";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";

export const handler: Handlers<MessageObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const params = Object.fromEntries(ctx.url.searchParams);
    const page = await MessageRepository.findAllByPage<MessageObjectType>(
      thread.id,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const fields = CreateMessageRequest.parse(await req.json());

    const { value: message } =
      await MessageRepository.create<MessageObjectType>(
        {
          ...fields,
          content: [{ type: "text", text: { value: fields.content } }],
          thread_id: thread.id,
        },
        thread.id,
      );

    return Response.json(message, { status: 201 });
  },
};
