import { Repository } from "$/repositories/_repository.ts";

export class MessageRepository extends Repository {
  static idPrefix = "msg";
  static object = "thread.message";
  static parent = "thread";
  static self = "message";
}
