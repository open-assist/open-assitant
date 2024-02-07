import { FreshContext, Handlers } from "$fresh/server.ts";
import { MessageRepository } from "$/repositories/message.ts";
import { type MessageObjectType, ModifyMessageRequest } from "openai_schemas";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.message_id as string,
  threadId: ctx.params.thread_id as string,
});

async function getMessage(ctx: FreshContext) {
  const { id, threadId } = getIDs(ctx);
  return await MessageRepository.findById<MessageObjectType>(id, threadId);
}

export const handler: Handlers<MessageObjectType | null> = {
  async GET(_req, ctx: FreshContext) {
    await getThread(ctx);

    return Response.json(await getMessage(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const thread = await getThread(ctx);
    const oldMessage = await getMessage(ctx);
    const fields = ModifyMessageRequest.parse(await req.json());

    const newMessage = await MessageRepository.update<MessageObjectType>(
      oldMessage,
      fields,
      thread.id,
    );
    return Response.json(newMessage);
  },
};
