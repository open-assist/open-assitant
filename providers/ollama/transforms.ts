import {
  CreateChatCompletionRequest,
  ChatCompletionRequestMessage,
  type ChatCompletionRequestMessageContentPartTextType,
  type ChatCompletionRequestMessageContentPartImageType,
  type CreateChatCompletionResponseType,
  type CreateChatCompletionStreamResponseType,
} from "openai_schemas";
import {
  ChatResponse,
  type ChatRequestType,
  type ChatMessageType,
} from "ollama_schemas";
import { ulid } from "$std/ulid/mod.ts";
import { toTimestamp } from "$/utils/date.ts";
import { CHAT_COMPLETION_PREFIX } from "$/utils/constants.ts";

export const ChatCompletionRequestMessageToChatMessage =
  ChatCompletionRequestMessage.transform((m) => {
    const { role, content: oaiContent } = m;
    let content = oaiContent;
    let images;
    if (Array.isArray(oaiContent)) {
      content = oaiContent
        .filter((c) => c.type === "text")
        .map((c) => (c as ChatCompletionRequestMessageContentPartTextType).text)
        .join("\n");
      images = oaiContent
        .filter((c) => c.type === "image_url")
        .map(
          (c) =>
            (c as ChatCompletionRequestMessageContentPartImageType).image_url,
        );
    }
    return {
      role,
      content,
      images,
    } as ChatMessageType;
  });

export const CreateChatCompletionRequestToChatRequest =
  CreateChatCompletionRequest.transform((request) => {
    const {
      model,
      messages,
      stream,
      seed,
      stop,
      temperature,
      top_p,
      response_format,
    } = request;
    const supportMessages = messages.filter(
      (m) => !(m.role === "function" || m.role === "tool"),
    );
    return {
      messages: supportMessages.map((m) =>
        ChatCompletionRequestMessageToChatMessage.parse(m),
      ),
      model,
      format: response_format?.type === "json_object" ? "json" : undefined,
      stream: !stream ? false : true,
      options: {
        temperature,
        seed,
        stop: Array.isArray(stop) ? undefined : stop,
        top_p,
      },
    } as ChatRequestType;
  });

export const ChatResponseToCreateChatCompletionResponse =
  ChatResponse.transform((response) => {
    const { model, created_at, message, prompt_eval_count, eval_count } =
      response;

    return {
      choices: [
        {
          message,
          index: 0,
          finish_reason: "stop",
        },
      ],
      created: toTimestamp(created_at),
      id: `${CHAT_COMPLETION_PREFIX}-${ulid()}`,
      model,
      object: "chat.completion",
      usage: {
        completion_tokens: eval_count,
        prompt_tokens: prompt_eval_count,
        total_tokens: (eval_count ?? 0) + (prompt_eval_count ?? 0),
      },
    } as CreateChatCompletionResponseType;
  });

export const ChatResponseToCreateChatCompletionStreamResponse =
  ChatResponse.transform((response) => {
    const { message, model, created_at, done } = response;
    return {
      choices: [
        {
          index: 0,
          finish_reason: done ? "stop" : null,
          delta: {
            role: message?.role,
            content: message?.content,
          },
        },
      ],
      created: toTimestamp(created_at),
      model,
      object: "chat.completion.chunk",
    } as CreateChatCompletionStreamResponseType;
  });
