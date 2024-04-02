import { FreshContext, Handlers } from "$fresh/server.ts";
import { AssistantRepository } from "$/repositories/assistant.ts";
import { AssistantObject, ModifyAssistantRequest } from "@open-schemas/zod/openai";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.assistant_id as string,
  parentId: ctx.state.organization as string,
});

async function getAssistant(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return await AssistantRepository.getInstance().findById(id, parentId);
}

export const handler: Handlers<AssistantObject | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getAssistant(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldAssistant = await getAssistant(ctx);
    const organization = ctx.state.organization as string;
    const fields = ModifyAssistantRequest.parse(await req.json());

    const newAssistant = await AssistantRepository.getInstance().update(
      oldAssistant,
      fields,
      organization,
    );
    return Response.json(newAssistant);
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    await getAssistant(ctx);
    const { id, parentId } = getIDs(ctx);

    await AssistantRepository.getInstance().destory(id, parentId);
    return Response.json({ id });
  },
};
