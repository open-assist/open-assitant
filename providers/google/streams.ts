import {
  CHAT_COMPLETION_PREFIX,
  CHAT_COMPLETION_DONE_EVENT,
} from "$/utils/constants.ts";
import { ulid } from "$std/ulid/mod.ts";
import { GenerateContentResponseToChatCompletionChunkObject } from "$/providers/google/transforms.ts";

export class GenerateContentTransformStream extends TransformStream {
  encoder: TextEncoder;
  decoder: TextDecoder;
  model: string;
  id: string;

  constructor(model: string) {
    super({
      transform: (chunk, controller) => {
        let chunkString = this.decoder.decode(chunk);
        if (chunkString.startsWith("[") || chunkString.startsWith(",")) {
          chunkString = chunkString.slice(1);
        }
        let done = false;
        if (chunkString.endsWith("]")) {
          chunkString = chunkString.slice(0, -1);
          done = true;
        }
        if (chunkString.length > 0) {
          const eventJson = JSON.parse(chunkString);
          const completionChunk =
            GenerateContentResponseToChatCompletionChunkObject.parse(eventJson);
          completionChunk.model = this.model;
          completionChunk.id = this.id;
          controller.enqueue(
            this.encoder.encode(`data: ${JSON.stringify(completionChunk)}\n\n`),
          );
        }
        if (done) {
          controller.enqueue(this.encoder.encode(CHAT_COMPLETION_DONE_EVENT));
        }
      },
    });
    this.decoder = new TextDecoder();
    this.encoder = new TextEncoder();
    this.model = model;
    this.id = `${CHAT_COMPLETION_PREFIX}-${ulid()}`;
  }
}
