import { type CreateChatCompletionStreamResponseType } from "openai_schemas";
import { ChatResponseToCreateChatCompletionStreamResponse } from "$/providers/ollama/transforms.ts";
import { ulid } from "$std/ulid/mod.ts";
import { CHAT_COMPLETION_PREFIX } from "$/utils/constants.ts";

/**
 * A TransformStream that transforms the raw ollama stream response into a
 * CreateChatCompletionStreamResponseType object. It parses the raw stream
 * events and data, and constructs the response object accordingly.
 */
export class ChatTransformStream extends TransformStream {
  encoder: TextEncoder;
  decoder: TextDecoder;
  chunk: CreateChatCompletionStreamResponseType;
  model: string | undefined;
  id: string;

  /**
   * Constructs a new MessageTransformStream instance.
   *
   * @param {string} [model] - Optional model override for the ollama response.
   *   If provided, the model property will be set to this value.
   */
  constructor(model?: string) {
    super({
      transform: (chunk, controller) => {
        const chunkString = this.decoder.decode(chunk);
        const eventJson = JSON.parse(chunkString);
        this.chunk =
          ChatResponseToCreateChatCompletionStreamResponse.parse(eventJson);
        this.chunk.id = this.id;
        if (this.model) this.chunk.model = this.model;
        controller.enqueue(
          this.encoder.encode(`data: ${JSON.stringify(this.chunk)}\n\n`),
        );

        if (eventJson.done) {
          controller.enqueue(this.encoder.encode("data: [DONE]\n\n"));
        }
      },
    });

    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.chunk = {} as CreateChatCompletionStreamResponseType;
    this.model = model;
    this.id = `${CHAT_COMPLETION_PREFIX}-${ulid()}`;
  }
}
