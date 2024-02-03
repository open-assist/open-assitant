import { FreshContext, Handlers } from "$fresh/server.ts";
import { AssistantRepository } from "$/repositories/assistant.ts";
import { AssistantObjectType, ModifyAssistantRequest } from "openai_schemas";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.assistant_id as string,
  parentId: ctx.state.organization as string,
});

async function getAssistant(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return (await AssistantRepository.findById<AssistantObjectType>(
    id,
    parentId,
  ));
}

export const handler: Handlers<AssistantObjectType | null> = {
  async GET(_req, ctx: FreshContext) {
    return Response.json(await getAssistant(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldAssistant = await getAssistant(ctx);
    const organization = ctx.state.organization as string;
    const fields = ModifyAssistantRequest.parse(await req.json());

    const newAssistant = await AssistantRepository.update<AssistantObjectType>(
      oldAssistant,
      fields,
      organization,
    );
    return Response.json(newAssistant);
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    await getAssistant(ctx);
    const { id, parentId } = getIDs(ctx);

    await AssistantRepository.destory(id, parentId);

    return new Response(undefined, { status: 204 });
  },
};
