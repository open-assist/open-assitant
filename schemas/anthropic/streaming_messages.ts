import { z } from "zod";
import { StopReason, MessageUsage } from "$/schemas/anthropic/messages.ts";
import {
  ChatCompletionChunkObject,
  ChatCompletionChunkChoice,
} from "$/schemas/openai/chat.ts";
import { now } from "$/utils/date.ts";

export const MessageStartEvent = z.object({
  type: z.enum(["message_start"]),
  message: z.object({
    id: z.string(),
    type: z.enum(["message"]),
    role: z.string(),
    model: z.string(),
    stop_reason: StopReason.nullish(),
    usage: MessageUsage,
  }),
});
export type MessageStartEvent = z.infer<typeof MessageStartEvent>;

export const MessageDeltaEvent = z.object({
  type: z.enum(["message_delta"]),
  delta: z.object({
    stop_reason: StopReason.nullish(),
    stop_sequence: z.string().nullish(),
  }),
  usage: MessageUsage.pick({ output_tokens: true }),
});
export type MessageDeltaEvent = z.infer<typeof MessageDeltaEvent>;

export const MessageStopEvent = z.object({
  type: z.enum(["message_stop"]),
});
export type MessageStopEvent = z.infer<typeof MessageStopEvent>;

export const ContentBlockStartEvent = z.object({
  type: z.enum(["content_block_start"]).default("content_block_start"),
  index: z.number().int().min(0),
  content_block: z.object({
    type: z.enum(["text"]).default("text"),
    text: z.string().default(""),
  }),
});
export type ContentBlockStartEvent = z.infer<typeof ContentBlockStartEvent>;

export const ContentBlockDeltaEvent = z.object({
  type: z.enum(["content_block_delta"]),
  index: z.number(),
  delta: z.object({
    type: z.string(),
    text: z.string(),
  }),
});
export type ContentBlockDeltaEvent = z.infer<typeof ContentBlockDeltaEvent>;

const MessageStartEventToChatCompletionChunkObject =
  MessageStartEvent.transform((event) => {
    const { message } = event;
    return ChatCompletionChunkObject.parse({
      ...message,
      created: now(),
    });
  });

const ContentBlockDeltaEventToChatCompletionChunkChioce =
  ContentBlockDeltaEvent.transform((event) => {
    const {
      index,
      delta: { text },
    } = event;
    return ChatCompletionChunkChoice.parse({
      index,
      delta: {
        content: text,
      },
    });
  });

const MessageDeltaEventToChatCompletionChunkChoice =
  MessageDeltaEvent.transform((event) => {
    const {
      delta: { stop_reason },
    } = event;
    return ChatCompletionChunkChoice.parse({
      finish_reason: stop_reason === "max_tokens" ? "length" : "stop",
    });
  });

const EVENT_REGEX = /^event:\s(\w+)$/m;
const DATA_REGEX = /^data:\s([\w\W]+)/m;
const ACCEPT_EVENTS = [
  "message_start",
  "content_block_delta",
  "message_delta",
  "message_stop",
];

/**
 * A TransformStream that transforms the raw anthropic stream
 * response into a CreateChatCompletionStreamResponseType object.
 * It parses the raw stream events and data, and constructs the
 * response object accordingly.
 */
export class MessageToChunkStream extends TransformStream {
  encoder: TextEncoder;
  decoder: TextDecoder;
  chunk: ChatCompletionChunkObject;
  model: string | undefined;

  /**
   * Constructs a new MessageTransformStream instance.
   *
   * @param {string} [model] - Optional model override for the anthropic response.
   *   If provided, the model property will be set to this value.
   */
  constructor(model?: string) {
    super({
      transform: (chunk, controller) => {
        const chunkString = this.decoder.decode(chunk);
        const events = chunkString.split("\n\n");
        for (const event of events) {
          let matches = event.match(EVENT_REGEX);
          if (!matches) continue;

          const [, eventName] = matches;
          if (!ACCEPT_EVENTS.includes(eventName)) continue;

          if (eventName === "message_stop") {
            controller.enqueue(this.encoder.encode("data: [DONE]\n\n"));
            continue;
          }

          matches = event.match(DATA_REGEX);
          if (!matches) continue;

          const [, dataJson] = matches;
          const data = JSON.parse(dataJson);
          if (data.type === "message_start") {
            this.chunk =
              MessageStartEventToChatCompletionChunkObject.parse(data);
            if (this.model) this.chunk.model = this.model;
            continue;
          }

          switch (data.type) {
            case "content_block_delta":
              this.chunk = {
                ...this.chunk,
                choices: [
                  ContentBlockDeltaEventToChatCompletionChunkChioce.parse(data),
                ],
                created: now(),
              };
              break;
            case "message_delta":
              this.chunk = {
                ...this.chunk,
                choices: [
                  {
                    ...this.chunk.choices[0],
                    ...MessageDeltaEventToChatCompletionChunkChoice.parse(data),
                  },
                ],
                created: now(),
              };
              break;
          }
          controller.enqueue(
            this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`),
          );
        }
      },
    });

    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.chunk = {} as ChatCompletionChunkObject;
    this.model = model;
  }
}
