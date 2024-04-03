import { FreshContext, Handlers } from "$fresh/server.ts";
import { MessageRepository } from "$/repositories/message.ts";
import {
  CreateMessageRequest,
  MessageObject,
  Pagination,
  Ordering,
} from "@open-schemas/zod/openai";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";

export const handler: Handlers<MessageObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const params = Object.fromEntries(ctx.url.searchParams);
    const page = await MessageRepository.getInstance().findAllByPage(
      thread.id,
      Pagination.parse(params),
      Ordering.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const fields = CreateMessageRequest.parse(await req.json());

    const message = await MessageRepository.getInstance().create(
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
