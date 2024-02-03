import { z } from "zod";
import { metadata, metaSchema } from "$/schemas/_base.ts";

/**
 * The request body, which creating a message.
 */
export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string({
    description: "The content of the message in array of text and/or images.",
  }),
  file_ids: z.array(z.string(), {
    description:
      "A list of file IDs that the assistant should use. Useful for tools like retrieval and code_interpreter that can access files.",
  }).max(10).optional(),
  metadata,
});

const textContentType = z.object({
  type: z.enum(["text"]),
  text: z.object({
    value: z.string({ description: "The data that makes up the text." }),
  }),
});
export type TextContent = z.infer<typeof textContentType>;

const imageFileContentType = z.object({
  type: z.enum(["image_file"]),
  image_file: z.object({
    file_id: z.string(),
  }),
});
const contentType = z.union([textContentType, imageFileContentType]);
export type Content = z.infer<typeof contentType>;

const messageType = messageSchema.omit({
  content: true,
}).merge(
  z.object({
    content: z.array(textContentType),
    thread_id: z.string({
      description: "The thread ID that this message belongs to.",
    }),
    assistant_id: z.string({
      description:
        "If applicable, the ID of the assistant that authored this message.",
    }).optional(),
    run_id: z.string({
      description:
        "If applicable, the ID of the run associated with the authoring of this message.",
    }).optional(),
  }),
).merge(metaSchema);

/**
 * Represents a message within a thread.
 */
export type Message = z.infer<typeof messageType>;
