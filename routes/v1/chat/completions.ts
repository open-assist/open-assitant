import { FreshContext, Handlers } from "$fresh/server.ts";
import {
  ChatCompletionObject,
  CreateChatCompletionRequest,
} from "$/schemas/openai/mod.ts";
import { getClient } from "$/providers/chat/mod.ts";
import { getModelsMapping } from "$/utils/llm.ts";
import { TEXT_EVENT_STREAM_HEADER } from "$/consts/api.ts";

export const handler: Handlers<ChatCompletionObject | null> = {
  async POST(req: Request, _ctx: FreshContext) {
    const modelsMapping = getModelsMapping();
    const fields = CreateChatCompletionRequest.parse(await req.json());
    let realModel = fields.model;
    if (modelsMapping && Object.hasOwn(modelsMapping, fields.model)) {
      realModel = modelsMapping[fields.model];
    }
    const Client = getClient(realModel);
    const response = await Client.createChatCompletion(fields, realModel);
    if (response instanceof ReadableStream) {
      return new Response(response, {
        headers: TEXT_EVENT_STREAM_HEADER,
      });
    }

    return Response.json(response);
  },
};
