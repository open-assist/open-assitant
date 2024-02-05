import { FreshContext, Handlers } from "$fresh/server.ts";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { AssistantRepository } from "$/repositories/assistant.ts";
import { AssistantObjectType, CreateAssistantRequest } from "openai_schemas";

export const handler: Handlers<AssistantObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await AssistantRepository.findAllByPage<AssistantObjectType>(
      organization,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req, ctx) {
    const fields = CreateAssistantRequest.parse(await req.json());
    const organization = ctx.state.organization as string;

    const assistant = await AssistantRepository.create<AssistantObjectType>(
      fields,
      organization,
    );

    return Response.json(assistant, { status: 201 });
  },
};
