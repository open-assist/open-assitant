import { FreshContext, Handlers } from "$fresh/server.ts";
import { type Token, tokenSchema } from "$/schemas/token.ts";
import { TokenRepository } from "$/repositories/token.ts";

const getIDs = (ctx: FreshContext) => ({
  id: ctx.params.token_id as string,
  parentId: ctx.state.organization as string,
});

async function getToken(ctx: FreshContext) {
  const { id, parentId } = getIDs(ctx);

  return (await TokenRepository.findById(
    id,
    parentId,
  )) as Token;
}

export const handler: Handlers<Token | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    return Response.json(await getToken(ctx));
  },

  async PATCH(req: Request, ctx: FreshContext) {
    const oldToken = await getToken(ctx);
    const { parentId } = getIDs(ctx);
    const fields = tokenSchema.parse(await req.json());
    const token = await TokenRepository.update<Token>(
      oldToken,
      fields,
      parentId,
    );

    return Response.json(token);
  },

  async DELETE(_req: Request, ctx: FreshContext) {
    const { parentId, id } = await getIDs(ctx);
    await TokenRepository.destory(id, parentId);

    return new Response(undefined, { status: 204 });
  },
};
