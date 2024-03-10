import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  type CreateChatCompletionResponseType,
  CreateChatCompletionStreamResponseType,
} from "openai_schemas";
import {
  Content,
  GenerateContentResponse,
  type ContentType,
  type GenerateContentRequestType,
  type FinishReasonType,
} from "googleai_schemas";
import {
  CHAT_COMPLETION_OBJECT,
  CHAT_COMPLETION_CHUNK_OBJECT,
  CHAT_COMPLETION_PREFIX,
} from "$/utils/constants.ts";
import { now } from "$/utils/date.ts";
import { ulid } from "$std/ulid/mod.ts";

export const ChatCompletionRequestMessageToContent =
  ChatCompletionRequestMessage.transform((message) => {
    const { role, content } = message;
    const parts = [];
    if (role === "user") {
      parts.push(
        ...(Array.isArray(content)
          ? content.map((c) => c as { text: string })
          : [{ text: content }]),
      );
    }
    if (role === "assistant") {
      parts.push({ text: content });
    }

    return {
      role: role === "assistant" ? "model" : "user",
      parts,
    } as ContentType;
  });

export const ContentToChatCompletionResponseMessage = Content.transform((c) => {
  const { parts } = c;
  return {
    role: "assistant",
    content: parts.map((p) => p.text).join("\n"),
  };
});

export const CreateChatCompletionRequestToGenerateContentRequest =
  CreateChatCompletionRequest.transform((request) => {
    const { messages, max_tokens, n, temperature, top_p, stop } = request;

    const contents: ContentType[] = [];
    const systemMessages = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content);
    if (systemMessages.length > 0) {
      contents.push({
        role: "user",
        parts: [{ text: systemMessages.join("\n") }],
      });
    }
    messages.forEach((m) => {
      if (m.role === "system") return;
      const content = ChatCompletionRequestMessageToContent.parse(m);
      if (content.role === contents[-1]?.role) {
        contents[-1].parts.push(...content.parts);
      } else {
        contents.push(content);
      }
    });

    return {
      contents,
      generationConfig: {
        stopSequences: stop && Array.isArray(stop) ? stop : [stop],
        candidateCount: n,
        maxOutputTokens: max_tokens,
        temperature,
        topP: top_p,
      },
    } as GenerateContentRequestType;
  });

function convertFinishReason(finishReason?: FinishReasonType | null) {
  switch (finishReason) {
    case "MAX_TOKENS":
      return "length";
    case "SAFETY":
    case "RECITATION":
      return "content_filter";
    case "STOP":
    case "OTHER":
    case "FINISH_REASON_UNSPECIFIED":
    default:
      return "stop";
  }
}

export const GenerateContentResponseToCreateChatCompletionResponse =
  GenerateContentResponse.transform((response) => {
    const { candidates } = response;

    return {
      choices: candidates.map((c) => {
        const { content, finishReason, index } = c;

        return {
          finish_reason: convertFinishReason(finishReason),
          index,
          message: ContentToChatCompletionResponseMessage.parse(content),
        };
      }),
      created: now(),
      id: `${CHAT_COMPLETION_PREFIX}-${ulid()}`,
      object: CHAT_COMPLETION_OBJECT,
    } as CreateChatCompletionResponseType;
  });

export const GenerateContentResponseToChatCompletionChunkObject =
  GenerateContentResponse.transform((response) => {
    const { candidates } = response;

    return {
      choices: candidates.map((c) => {
        const { content, finishReason, index } = c;
        return {
          finish_reason: convertFinishReason(finishReason),
          index,
          delta: {
            content: content.parts.map((p) => p.text).join(""),
            role: "assistant",
          },
        };
      }),
      created: now(),
      object: CHAT_COMPLETION_CHUNK_OBJECT,
    } as CreateChatCompletionStreamResponseType;
  });
