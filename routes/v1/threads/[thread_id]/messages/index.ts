import { FreshContext, Handlers } from "$fresh/server.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { MessageRepository } from "$/repositories/message.ts";
import { CreateMessageRequest, type MessageObjectType } from "openai_schemas";

export const handler: Handlers<MessageObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const threadId = ctx.params.thread_id as string;

    const page = await MessageRepository.findAllByPage<MessageObjectType>(
      threadId,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields = CreateMessageRequest.parse(await req.json());
    const threadId = ctx.params.thread_id as string;

    const message = await MessageRepository.create<MessageObjectType>(
      {
        ...fields,
        content: [{ type: "text", text: { value: fields.content } }],
        thread_id: threadId,
      },
      threadId,
    );

    return Response.json(message, { status: 201 });
  },
};
