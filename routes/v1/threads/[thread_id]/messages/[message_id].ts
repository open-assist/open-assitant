import { FreshContext, Handlers } from "$fresh/server.ts";
import { MessageRepository } from "$/repositories/message.ts";
import { type MessageObjectType, ModifyMessageRequest } from "openai_schemas";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.message_id as string,
  threadId: ctx.params.thread_id as string,
  organization: ctx.state.organization as string,
});

async function getMessage(ctx: FreshContext) {
  const { id, threadId } = getIDs(ctx);

  return (await MessageRepository.findById<MessageObjectType>(
    id,
    threadId,
  ));
}

export const handler: Handlers<MessageObjectType | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getMessage(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldMessage = await getMessage(ctx);
    const { threadId } = getIDs(ctx);
    const fields = ModifyMessageRequest.parse(
      await req.json(),
    );

    const newMessage = await MessageRepository.update<MessageObjectType>(
      oldMessage,
      fields,
      threadId,
    );
    return Response.json(newMessage);
  },
};
