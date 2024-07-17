import Base from "$/providers/client/google.ts";
import {
  ChatCompletionChoice,
  ChatCompletionChunkChoice,
  ChatCompletionChunkObject,
  ChatCompletionObject,
  CreateChatCompletionRequest,
} from "$/schemas/openai/chat.ts";
import {
  GenerateContentRequest,
  GenerateContentResponse,
  UsageMetadata,
} from "$/schemas/google/mod.ts";
import { Candidate } from "$/schemas/google/mod.ts";
import { genUlid } from "$/utils/mod.ts";
import { Usage } from "$/schemas/openai/mod.ts";
import { now } from "$/utils/date.ts";
import { CHAT_COMPLETION_PREFIX, DONE_EVENT } from "$/consts/llm.ts";
import * as log from "$std/log/mod.ts";
import { logRejectionReason } from "$/providers/log.ts";

function convertRole(role: Candidate["content"]["role"]) {
  if (role === "model") {
    return "assistant";
  }
  return "user";
}

/**
 * Transform Google AI's parts to OpenAI's content.
 * ```ts
 * { text: string }[] => string
 * ```
 *
 * @param parts Google AI parts
 * @returns string OpenAI content
 */
function transformPartsToContent(parts: Candidate["content"]["parts"]) {
  return parts.map((p) => (p as { text: string }).text).join(
    "\n",
  );
}

function convertFinishReason(
  reason: Candidate["finishReason"],
): ChatCompletionChoice["finish_reason"] {
  switch (reason) {
    case "MAX_TOKENS":
      return "length";
    case "SAFETY":
      return "content_filter";
    case "STOP":
    case "FINISH_REASON_UNSPECIFIED":
    case "OTHER":
    default:
      return "stop";
  }
}

function convertCandidateToChoice(candidate: Candidate): ChatCompletionChoice {
  const { content, finishReason, index } = candidate;
  return {
    message: {
      role: convertRole(content.role),
      content: transformPartsToContent(content.parts),
    },
    finish_reason: convertFinishReason(finishReason),
    index,
  } as ChatCompletionChoice;
}

function convertCandidateToChunkChoice(
  candidate: Candidate,
): ChatCompletionChunkChoice {
  const { content, finishReason, index } = candidate;

  return {
    index,
    delta: {
      role: convertRole(content.role),
      content: transformPartsToContent(content.parts),
    },
    finish_reason: convertFinishReason(finishReason),
  } as ChatCompletionChunkChoice;
}

/**
 * Transform Google AI's usage metadata to OpenAI's usage
 *
 * @param usageMetadata Google AI's usage metadata
 * @returns OpenAI's usage
 */
function transformUsageMetadataToUsage(usageMetadata: UsageMetadata) {
  const { promptTokenCount, candidatesTokenCount, totalTokenCount } =
    usageMetadata;
  return {
    completion_tokens: candidatesTokenCount,
    prompt_tokens: promptTokenCount,
    total_tokens: totalTokenCount,
  } as Usage;
}

function transformGenerateContentToChunk(
  response: GenerateContentResponse,
): ChatCompletionChunkObject {
  const { candidates } = response;
  return {
    object: "chat.completion.chunk",
    created: now(),
    choices: candidates.map(convertCandidateToChunkChoice),
  } as ChatCompletionChunkObject;
}

class GenerateContentTransformStream extends TransformStream {
  encoder: TextEncoder;
  decoder: TextDecoder;
  model: string;
  id: string;

  constructor(model: string) {
    super({
      transform: (chunk, controller) => {
        let chunkString = this.decoder.decode(chunk);
        log.debug(
          `[GenerateContentTransformStream] input chunk: ${chunkString}`,
        );

        let done = false;
        if (chunkString.startsWith("[") || chunkString.startsWith(",")) {
          chunkString = chunkString.slice(1);
        }
        if (chunkString.endsWith("]")) {
          chunkString = chunkString.slice(0, -1);
          done = true;
        }

        if (chunkString.length < 1) {
          controller.enqueue(this.encoder.encode(DONE_EVENT));
          return;
        }

        const response = JSON.parse(chunkString);
        const completionChunk = GenerateContentResponse.transform(
          transformGenerateContentToChunk,
        ).parse(response);
        completionChunk.model = this.model;
        completionChunk.id = this.id;
        controller.enqueue(
          this.encoder.encode(`data: ${JSON.stringify(completionChunk)}\n\n`),
        );

        if (done) {
          controller.enqueue(this.encoder.encode(DONE_EVENT));
        }
      },
    });

    this.decoder = new TextDecoder();
    this.encoder = new TextEncoder();
    this.model = model;
    this.id = genUlid(CHAT_COMPLETION_PREFIX);
  }
}

export default class Google extends Base {
  static async createChatCompletion(
    request: CreateChatCompletionRequest,
    realModel?: string,
  ) {
    const gcq = CreateChatCompletionRequest.transform(
      ({ messages }: CreateChatCompletionRequest) => {
        return {
          contents: messages.map((m) => {
            const { role, content } = m;
            return {
              parts: Array.isArray(content)
                ? content.map((c) => [c])
                : [{ text: content }],
              role: role === "user" ? "user" : "model",
            };
          }),
        } as GenerateContentRequest;
      },
    ).parse(request);

    const action = request.stream ? "streamGenerateContent" : "generateContent";
    const response = await this.fetch(
      `/models/${realModel ?? request.model}:${action}`,
      {
        method: "POST",
        body: JSON.stringify(gcq),
      },
    );

    if (request.stream) {
      const { writable, readable } = new GenerateContentTransformStream(
        request.model,
      );
      response.body?.pipeTo(writable).catch(logRejectionReason);
      return readable;
    } else {
      const gcp = await response.json();
      return GenerateContentResponse.transform(
        ({ candidates, usageMetadata }: GenerateContentResponse) => {
          return {
            id: genUlid(CHAT_COMPLETION_PREFIX),
            choices: candidates.map(convertCandidateToChoice),
            created: now(),
            model: request.model,
            object: "chat.completion",
            usage: transformUsageMetadataToUsage(usageMetadata),
          } as ChatCompletionObject;
        },
      ).parse(gcp);
    }
  }
}
