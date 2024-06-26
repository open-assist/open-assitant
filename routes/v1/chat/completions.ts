import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  CreateChatCompletionRequest,
  ChatCompletionObject,
} from "@open-schemas/zod/openai";
import { getClient } from "$/providers/llm/client.ts";
import { getModelsMapping } from "$/utils/llm.ts";
import { TEXT_EVENT_STREAM_HEADER } from "$/consts/api.ts";

export const handler: Handlers<ChatCompletionObject | null> = {
  async POST(req: Request, _ctx: FreshContext) {
    const Client = await getClient();
    const modelsMapping = getModelsMapping();
    const fields = CreateChatCompletionRequest.parse(await req.json());
    let mappedModel;
    if (modelsMapping && Object.hasOwn(modelsMapping, fields.model)) {
      mappedModel = fields.model;
      fields.model = modelsMapping[fields.model as keyof object];
    }
    const response = await Client.createChatCompletion(fields, mappedModel);
    if (response instanceof ReadableStream) {
      return new Response(response, {
        headers: TEXT_EVENT_STREAM_HEADER,
      });
    }
    return Response.json(response);
  },
};
