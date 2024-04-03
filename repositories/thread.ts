import { kv, Repository } from "$/repositories/base.ts";
import { MessageRepository } from "$/repositories/message.ts";
import { CreateThreadRequest, MessageObject, ThreadObject } from "@open-schemas/zod/openai";
import { Conflict } from "$/utils/errors.ts";
import { THREAD_PREFIX, THREAD_OBJECT, THREAD_KEY, ORGANIZATION } from "$/consts/api.ts";

export class ThreadRepository extends Repository<ThreadObject> {
  private static instance: ThreadRepository;

  private constructor() {
    super(THREAD_PREFIX, THREAD_OBJECT, ORGANIZATION, THREAD_KEY);
  }

  public static getInstance(): ThreadRepository {
    if (!ThreadRepository.instance) {
      ThreadRepository.instance = new ThreadRepository();
    }
    return ThreadRepository.instance;
  }

  async createWithMessages(fields: CreateThreadRequest, org: string) {
    const operation = kv.atomic();

    const thread = await this.create(
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
        } as MessageObject;
        await MessageRepository.getInstance().create(messageFields, thread.id, operation);
      });
    }

    const { ok } = await operation.commit();
    if (!ok) throw new Conflict();

    return thread;
  }
}
