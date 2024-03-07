import { type CreateChatCompletionStreamResponseType } from "openai_schemas";
import { MessageStartEventToCreateChatCompletionStreamResponse } from "$/providers/anthropic/transforms.ts";

const EVENT_REGEX = /^event:\s(\w+)$/m;
const DATA_REGEX = /^data:\s([\w\W]+)/m;
const ACCEPT_EVENTS = ["message_start", "content_block_delta", "message_delta"];

export class MessageTransformStream extends TransformStream {
  encoder: TextEncoder;
  decoder: TextDecoder;
  chunk: CreateChatCompletionStreamResponseType;
  model: string | undefined;

  constructor(model?: string) {
    super({
      transform: (chunk, controller) => {
        const chunkString = this.decoder.decode(chunk);
        const events = chunkString.split("\n\n");
        for (const event of events) {
          let matches = event.match(EVENT_REGEX);
          if (!matches) return;

          const [, eventName] = matches;
          if (!ACCEPT_EVENTS.includes(eventName)) return;

          matches = event.match(DATA_REGEX);
          if (!matches) return;

          const [, dataJson] = matches;
          const data = JSON.parse(dataJson);
          switch (data.type) {
            case "message_start":
              this.chunk =
                MessageStartEventToCreateChatCompletionStreamResponse.parse(
                  data,
                );
              if (this.model) this.chunk.model = this.model;
              break;
            case "content_block_delta":
              this.chunk = {
                ...this.chunk,
                choices: [
                  {
                    index: 0,
                    delta: {
                      content: data.delta.text,
                    },
                    finish_reason: null,
                  },
                ],
                created: Date.now(),
              };
              break;
            case "message_delta":
              this.chunk = {
                ...this.chunk,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason:
                      data.delta.stop_reason === "max_tokens"
                        ? "length"
                        : "stop",
                  },
                ],
                created: Date.now(),
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
    this.chunk = {} as CreateChatCompletionStreamResponseType;
    this.model = model;
  }
}
