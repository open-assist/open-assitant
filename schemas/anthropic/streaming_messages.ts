import { z } from "zod";
import * as log from "$std/log/mod.ts";
import { StopReason, MessageUsage } from "$/schemas/anthropic/messages.ts";
import {
  ChatCompletionChunkObject,
  ChatCompletionChunkChoice,
  ChatCompletionFunctionToolCall,
} from "$/schemas/openai/chat.ts";
import { now } from "$/utils/date.ts";
import { XML } from "$/utils/xml.ts";
import { ulid } from "$std/ulid/mod.ts";

const MESSAGE_START = "message_start";
const MESSAGE_DETLA = "message_delta";
const MESSAGE_STOP = "message_stop";

const CONTENT_BLOCK_START = "content_block_start";
const CONTENT_BLOCK_DELTA = "content_block_delta";
const CONTENT_BLOCK_STOP = "content_block_stop";

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

export const ContentBlockStopEvent = z.object({
  type: z.enum([CONTENT_BLOCK_STOP]).default(CONTENT_BLOCK_STOP),
  index: z.number().int().min(0),
});
export type ContentBlockStopEvent = z.infer<typeof ContentBlockStopEvent>;

const MessageStartEventToChatCompletionChunkObject =
  MessageStartEvent.transform((event) => {
    const { message } = event;
    return ChatCompletionChunkObject.parse({
      ...message,
      created: now(),
    });
  });

const ContentBlockDeltaEventToChioce = ContentBlockDeltaEvent.transform(
  (event) => {
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
  },
);

const ContentBlockStopEventToChoice = ContentBlockStopEvent.transform(
  (event) => {
    return ChatCompletionChunkChoice.parse(event);
  },
);

const MessageDeltaEventToChoice = MessageDeltaEvent.transform((event) => {
  const {
    delta: { stop_reason },
  } = event;
  return ChatCompletionChunkChoice.parse({
    finish_reason: stop_reason === "max_tokens" ? "length" : "stop",
  });
});

const EVENT_REGEX = /^event:\s(\w+)$/m;
const DATA_REGEX = /^data:\s([\w\W]+)/m;
const CALL_REPSONE_START = "<calls";

const ACCEPT_EVENTS = [
  MESSAGE_START,
  CONTENT_BLOCK_DELTA,
  CONTENT_BLOCK_STOP,
  MESSAGE_DETLA,
  MESSAGE_STOP,
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
  previousEvent: string | undefined;
  callResponseStarting: boolean;
  callResponse: string;

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
            this.previousEvent = eventName;
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
            this.previousEvent = data.type;
            continue;
          } else if (data.type === CONTENT_BLOCK_DELTA) {
            const choice = ContentBlockDeltaEventToChioce.parse(data);
            if (choice.delta.content === CALL_REPSONE_START) {
              this.callResponseStarting = true;
            }
            if (this.callResponseStarting) {
              this.callResponse = `${this.callResponse}${choice.delta.content}`;
            } else {
              this.chunk.choices = [
                {
                  ...this.chunk.choices[0],
                  ...choice,
                },
              ];
              this.chunk.created = now();
              controller.enqueue(
                this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`),
              );
            }
          } else if (
            data.type === CONTENT_BLOCK_STOP &&
            this.callResponseStarting
          ) {
            try {
              const xml = `${this.callResponse}</calls>`;
              const calls = XML.parse(xml).calls;
              log.debug(`calls: ${JSON.stringify(calls)}`);
              const toolCalls = Array.isArray(calls.tool_call)
                ? calls.tool_call
                : [calls.tool_call];
              this.chunk.choices[0].delta.tool_calls = toolCalls.map(
                // deno-lint-ignore no-explicit-any
                (c: any, index: number) => {
                  const {
                    function: { name, parameters },
                  } = c;
                  return {
                    type: "function",
                    function: {
                      name,
                      arguments: JSON.stringify(parameters),
                    },
                    id: `call-${ulid()}`,
                    index,
                  } as ChatCompletionFunctionToolCall;
                },
              );
              this.chunk.choices[0].delta.content = null;
              this.chunk.created = now();
              controller.enqueue(
                this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`),
              );
            } catch (e) {
              log.error(e);
            }

            this.callResponseStarting = false;
          } else if (data.type === MESSAGE_DETLA) {
            this.chunk.choices = [
              {
                ...this.chunk.choices[0],
                ...MessageDeltaEventToChoice.parse(data),
              },
            ];
            this.chunk.created = now();
            controller.enqueue(
              this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`),
            );
          }
        }
      },
    });

    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.chunk = {} as ChatCompletionChunkObject;
    this.model = model;
    this.callResponseStarting = false;
    this.callResponse = "";
  }
}
