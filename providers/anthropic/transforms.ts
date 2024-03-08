import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponseType,
  CreateChatCompletionStreamResponseType,
} from "openai_schemas";
import {
  type CreateMessageRequestType,
  CreateMessageResponse,
  MessageStartEvent,
} from "anthropic_schemas";
import { now } from "$/utils/date.ts";

const ChatCompletionRequestMessageToMessage =
  ChatCompletionRequestMessage.transform((message) => {
    const { role, content } = message;
    if (Array.isArray(content)) {
      return {
        role,
        content: content.map((c) => {
          if (c.type === "image_url") {
            return {
              type: "image",
              source: {
                type: "base64",
                data: c.image_url.url,
              },
            };
          }
          return c;
        }),
      };
    }
    return message;
  });

/**
 * transform OpenAI create chat completion request to Anthropic create message request
 */
export const CreateChatCompletionRequestToCreateMessageRequest =
  CreateChatCompletionRequest.transform((request) => {
    const {
      model,
      messages,
      max_tokens,
      user,
      temperature,
      top_p,
      stop,
      stream,
    } = request;
    const systemMessages = messages.filter((m) => m.role === "system");
    const supportMessages = messages.filter((m) =>
      ["user", "assistant"].includes(m.role),
    );
    return {
      model,
      messages: supportMessages.map((m) =>
        ChatCompletionRequestMessageToMessage.parse(m),
      ),
      metadata: user && { user_id: user },
      stop_sequences: stop && (Array.isArray(stop) ? stop : [stop]),
      system:
        systemMessages.length > 0 &&
        systemMessages.map((m) => m.content).join("\n"),
      max_tokens: max_tokens ?? 4096,
      temperature,
      top_p,
      stream,
    } as CreateMessageRequestType;
  });

/**
 * transform anthropic response to openai response
 */
export const CreateMessageResponseToCreateChatCompletionResponse =
  CreateMessageResponse.transform((response) => {
    const { id, content, model, role, stop_reason, usage } = response;
    return {
      id,
      model,
      choices: [
        {
          index: 0,
          message: {
            role,
            content: content.map((c) => c.text).join("\n"),
          },
          finish_reason:
            stop_reason && stop_reason === "max_tokens" ? "length" : "stop",
        },
      ],
      usage: usage && {
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
      },
      created: Date.now(),
      object: "chat.completion",
      system_fingerprint: "fp_open_assistant",
    } as CreateChatCompletionResponseType;
  });

export const MessageStartEventToCreateChatCompletionStreamResponse =
  MessageStartEvent.transform((response) => {
    const {
      message: { id, model, role },
    } = response;

    return {
      id,
      model,
      choices: [
        {
          index: 0,
          delta: {
            role,
            content: "",
          },
          finish_reason: null,
        },
      ],
      created: now(),
      object: "chat.completion.chunk",
      system_fingerprint: "fp_open_assistant",
    } as CreateChatCompletionStreamResponseType;
  });
