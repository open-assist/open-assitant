import { z } from "zod";
import { metadata, metaSchema } from "$/schemas/_base.ts";
import { Repository } from "$/repositories/_repository.ts";

export class ThreadRepository extends Repository {
  static idPrefix = "thrd";
  static object = "thread";
  static parent = "organization";
  static self = "thread";
}

/**
 * The request body, which createing a thread.
 */
export const threadSchema = z.object({
  metadata,
});

export const threadType = threadSchema.merge(metaSchema);

/**
 * Represents a thread that contains messages.
 */
export type Thread = z.infer<typeof threadType>;
