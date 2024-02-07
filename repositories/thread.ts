import { kv, Repository } from "$/repositories/_repository.ts";
import { MessageRepository } from "$/repositories/message.ts";
import {
  CreateThreadRequestType,
  MessageObjectType,
  ThreadObjectType,
} from "openai_schemas";
import { DbCommitError } from "$/utils/errors.ts";

export class ThreadRepository extends Repository {
  static idPrefix = "thrd";
  static object = "thread";
  static parent = "organization";
  static self = "thread";

  static async createWithMessages(
    fields: CreateThreadRequestType,
    org: string,
  ) {
    const operation = kv.atomic();

    const { value: thread } = await this.create<ThreadObjectType>(
      {
        metadata: fields.metadata,
      },
      org,
      operation,
    );

    if (fields.messages) {
      fields.messages.forEach(async (m) => {
        const messageFields = {
          ...m,
          content: [{ type: "text", text: { value: m.content } }],
          thread_id: thread.id,
        } as MessageObjectType;
        await MessageRepository.create<MessageObjectType>(
          messageFields,
          thread.id,
          operation,
        );
      });
    }

    const { ok } = await operation.commit();
    if (!ok) throw new DbCommitError();

    return { value: thread };
  }
}
