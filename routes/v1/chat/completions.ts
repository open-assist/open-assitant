import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  CreateChatCompletionRequest,
  type CreateChatCompletionResponseType,
} from "openai_schemas";
import { get_client } from "$/llm/client.ts";
import { MODELS_MAPPING } from "$/utils/model.ts";

export const handler: Handlers<CreateChatCompletionResponseType | null> = {
  async POST(req: Request, _ctx: FreshContext) {
    const Client = await get_client();
    const fields = CreateChatCompletionRequest.parse(await req.json());
    let mappedModel;
    if (MODELS_MAPPING && Object.hasOwn(MODELS_MAPPING, fields.model)) {
      mappedModel = fields.model;
      fields.model = MODELS_MAPPING[fields.model as keyof object];
    }
    const response = await Client.createChatCompletion(fields, mappedModel);
    if (response instanceof ReadableStream) {
      return new Response(response, {
        headers: {
          "Content-Type": "text/event-stream",
        },
      });
    }
    return Response.json(response);
  },
};
