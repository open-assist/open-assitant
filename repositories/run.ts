import { FunctionToolCall, Meta } from "$/schemas/_base.ts";
import { kv, Repository } from "$/repositories/_repository.ts";
import { DbCommitError } from "$/utils/errors.ts";
import { Run, ToolOutput } from "$/schemas/run.ts";
import { Step, ToolCalls } from "$/schemas/step.ts";
import { StepRepository } from "$/repositories/step.ts";

// 10 minutes
export const RUN_EXPIRED_DURATION = 10 * 60 * 1000;

export class RunRepository extends Repository {
  static idPrefix = "run";
  static object = "thread.run";
  static parent = "thread";
  static self = "run";
  static hasSecondaryKey = true;

  static async create<T extends Meta>(fields: Partial<T>, parentId?: string) {
    const { operation, value } = this.createWithoutCommit<T>({
      ...fields,
      status: "queued",
      expires_at: Date.now() + RUN_EXPIRED_DURATION,
    }, parentId);
    operation.enqueue({ action: "perform", runId: value.id })
      .enqueue({ action: "expire", runId: value.id }, {
        delay: RUN_EXPIRED_DURATION,
      });

    const { ok } = await operation.commit();
    if (!ok) throw new DbCommitError();

    return value;
  }

  static async cancel(old: Run, threadId: string) {
    const newRun = {
      ...old,
      status: "cancelling",
    } as Run;

    const { ok } = await kv
      .atomic()
      .enqueue({ action: "cancel", runId: (newRun as Meta).id })
      .set(this.genKvKey(threadId, (old as Meta).id), newRun)
      .commit();
    if (!ok) throw new DbCommitError();

    return newRun;
  }

  static async submitToolOutputs(run: Run, step: Step, outputs: ToolOutput[]) {
    const newRun = {
      ...run,
      status: "queued",
    } as Run;

    const atomicOp = kv
      .atomic()
      .enqueue({ action: "perform", runId: newRun.id })
      .set(this.genKvKey(run.thread_id, run.id), newRun);

    const toolCallsMap = (step.step_details as ToolCalls).tool_calls.reduce(
      (pre, cur) => ({
        ...pre,
        [cur.id]: cur,
      }),
      {},
    ) as { [key: string]: FunctionToolCall };

    outputs.forEach((o) => {
      toolCallsMap[o.tool_call_id].function.output = o.output;
    });
    const newStep = {
      ...step,
      step_details: {
        ...step.step_details,
        tool_calls: Object.values(toolCallsMap),
      },
    } as Step;
    atomicOp.set(StepRepository.genKvKey(run.id, step.id), newStep);

    const { ok } = await atomicOp.commit();
    if (!ok) throw new DbCommitError();

    return newRun;
  }
}
