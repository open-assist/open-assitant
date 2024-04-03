import { AssistantObject } from "@open-schemas/zod/openai";
import { Repository } from "$/repositories/base.ts";
import { ASSISTANT_PREFIX, ASSISTANT_OBJECT, ASSISTANT_KEY } from "$/consts/api.ts";

export class AssistantRepository extends Repository<AssistantObject> {
  private static instance: AssistantRepository;

  private constructor() {
    super(ASSISTANT_PREFIX, ASSISTANT_OBJECT, "organization", ASSISTANT_KEY, true);
  }

  public static getInstance(): AssistantRepository {
    if (!AssistantRepository.instance) {
      AssistantRepository.instance = new AssistantRepository();
    }
    return AssistantRepository.instance;
  }
}
