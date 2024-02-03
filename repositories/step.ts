import { Repository } from "$/repositories/_repository.ts";

export class StepRepository extends Repository {
  static idPrefix = "step";
  static object = "thread.run.step";
  static parent = "run";
  static self = "step";
  static hasSecondaryKey = true;
}
