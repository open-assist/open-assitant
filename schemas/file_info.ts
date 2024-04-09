import { z } from "zod";

export const FileInfo = z.object({
  // file_id: z.string(),
  file_path: z.string(),
  file_type: z.string(),
});
export type FileInfo = z.infer<typeof FileInfo>;
