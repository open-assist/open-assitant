import {
  MessageStartEvent,
  MessageDeltaEvent,
  ContentBlockDeltaEvent,
} from "@open-schemas/zod/anthropic";
import {
  ChatCompletionChunkObject,
  ChatCompletionChunkChoice,
  ChatCompletionToolCall,
} from "@open-schemas/zod/openai";
import * as log from "$std/log/mod.ts";
import {
  DONE_EVENT,
  MESSAGE_START,
  MESSAGE_DETLA,
  MESSAGE_STOP,
  CONTENT_BLOCK_DELTA,
  CONTENT_BLOCK_STOP,
  CHAT_COMPLETION_PREFIX,
} from "$/consts/llm.ts";
import { convertStopReasonToFinishReason } from "$/schemas/anthropic/messages.ts";
import { now } from "$/utils/date.ts";
import { XML } from "$/utils/xml.ts";
import { ulid } from "$std/ulid/mod.ts";
import { genSystemFingerprint } from "$/utils/llm.ts";

const MessageStartEventToChatCompletionChunkObject = MessageStartEvent.transform(
  async (event: MessageStartEvent) => {
    const {
      message: { model, role },
    } = event;
    return ChatCompletionChunkObject.parse({
      id: `${CHAT_COMPLETION_PREFIX}-${ulid()}`,
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
      model,
      system_fingerprint: await genSystemFingerprint(),
    });
  },
);

const ContentBlockDeltaEventToChioce = ContentBlockDeltaEvent.transform(
  (event: ContentBlockDeltaEvent) => {
    const {
      index,
      delta: { text },
    } = event;
    return {
      index,
      delta: {
        content: text,
      },
    } as ChatCompletionChunkChoice;
  },
);

const MessageDeltaEventToChoice = MessageDeltaEvent.transform((event: MessageDeltaEvent) => {
  const {
    delta: { stop_reason, stop_sequence },
  } = event;
  return {
    finish_reason: convertStopReasonToFinishReason(stop_reason, stop_sequence),
  } as ChatCompletionChunkChoice;
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
      transform: async (chunk, controller) => {
        const chunkString = this.decoder.decode(chunk);
        const events = chunkString.split("\n\n");
        for (const event of events) {
          let matches = event.match(EVENT_REGEX);
          if (!matches) continue;

          const [, eventName] = matches;
          if (!ACCEPT_EVENTS.includes(eventName)) continue;

          if (eventName === MESSAGE_STOP) {
            controller.enqueue(this.encoder.encode(DONE_EVENT));
            this.previousEvent = eventName;
            continue;
          }

          matches = event.match(DATA_REGEX);
          if (!matches) continue;

          const [, dataJson] = matches;
          const data = JSON.parse(dataJson);
          if (data.type === MESSAGE_START) {
            this.chunk = await MessageStartEventToChatCompletionChunkObject.parseAsync(data);
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
              controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`));
            }
          } else if (data.type === CONTENT_BLOCK_STOP && this.callResponseStarting) {
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
                  } as ChatCompletionToolCall;
                },
              );
              this.chunk.choices[0].delta.content = null;
              this.chunk.created = now();
              controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`));
            } catch (e) {
              log.error(e);
            }

            this.callResponseStarting = false;
          } else if (data.type === MESSAGE_DETLA) {
            this.chunk.choices = [
              {
                ...this.chunk.choices[0],
                ...MessageDeltaEventToChoice.parse(data),
                delta: {
                  role: "assistant",
                },
              },
            ];
            this.chunk.created = now();
            controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`));
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
