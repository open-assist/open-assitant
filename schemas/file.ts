import { z } from "zod";

export const CreateFileRequest = z.object({
  file: z.object({
    name: z.string(),
    size: z
      .number()
      .int()
      .min(1)
      .max(512 * 1024 * 1024),
  }),
  purpose: z.enum(["fine-tune", "assistants"]),
});

export const FileObject = z.object({
  id: z.string(),
  bytes: z.number().int(),
  created_at: z.number().int(),
  filename: z.string(),
  object: z.enum(["file"]),
  purpose: z.enum([
    "fine-tune",
    "fine-tune-results",
    "assistants",
    "assistants_output",
  ]),
  // status: z.enum(["uploaded", "processed", "error"]),
  // status_details: z.string().optional(),
});
export type FileObjectType = z.infer<typeof FileObject>;
