import { Repository } from "$/repositories/_repository.ts";

export class ThreadRepository extends Repository {
  static idPrefix = "thrd";
  static object = "thread";
  static parent = "organization";
  static self = "thread";
}
