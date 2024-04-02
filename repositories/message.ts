import { MessageObject } from "@open-schemas/zod/openai";
import { Repository } from "$/repositories/base.ts";

export class MessageRepository extends Repository<MessageObject> {
  private static instance: MessageRepository;

  private constructor() {
    super("msg", "thread.message", "thread", "message");
  }

  public static getInstance(): MessageRepository {
    if (!MessageRepository.instance) {
      MessageRepository.instance = new MessageRepository();
    }
    return MessageRepository.instance;
  }
}
