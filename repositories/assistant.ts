import { Repository } from "$/repositories/_repository.ts";

export class AssistantRepository extends Repository {
  static idPrefix = "asst";
  static object = "assistant";
  static parent = "organization";
  static self = "assistant";
  static hasSecondaryKey = true;
}
