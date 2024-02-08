import { FreshContext, Handlers } from "$fresh/server.ts";
import { type Token, tokenSchema } from "$/schemas/token.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { TokenRepository } from "$/repositories/token.ts";

export const handler: Handlers<Token | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await TokenRepository.findAllByPage<Token>(
      organization,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    page.data = page.data.map((t) => ({
      ...t,
      content: TokenRepository.maskToken(t.content),
    }));

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const fields = tokenSchema.parse(await req.json());
    const organization = ctx.state.organization as string;

    const { value: token } = await TokenRepository.create<Token>(
      fields,
      organization,
    );

    return Response.json(token, {
      status: 201,
    });
  },
};
