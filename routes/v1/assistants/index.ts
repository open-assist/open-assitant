import { FreshContext, Handlers } from "$fresh/server.ts";
import { AssistantRepository } from "$/repositories/assistant.ts";
import {
  CreateAssistantRequest,
  AssistantObject,
  Pagination,
  Ordering,
} from "@open-schemas/zod/openai";

export const handler: Handlers<AssistantObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await AssistantRepository.getInstance().findAllByPage(
      organization,
      Pagination.parse(params),
      Ordering.parse(params),
    );

    return Response.json(page);
  },

  async POST(req, ctx) {
    const fields = CreateAssistantRequest.parse(await req.json());
    const organization = ctx.state.organization as string;

    const assistant = await AssistantRepository.getInstance().create(fields, organization);

    return Response.json(assistant, { status: 201 });
  },
};
