import type {
  ToolOutputType,
  RunStepDetailsToolCallsFunctionObjectType,
  RunStepDetailsToolCallsObjectType,
  RunObjectType,
  RunStepObjectType,
} from "openai_schemas";
import { kv, Repository } from "$/repositories/_repository.ts";
import { StepRepository } from "$/repositories/step.ts";
import { type Meta } from "$/schemas/_base.ts";
import { DbCommitError } from "$/utils/errors.ts";

// 10 minutes
export const RUN_EXPIRED_DURATION = 10 * 60 * 1000;

export class RunRepository extends Repository {
  static idPrefix = "run";
  static object = "thread.run";
  static parent = "thread";
  static self = "run";
  static hasSecondaryKey = true;

  static async create<T extends Meta>(
    fields: Partial<T>,
    parentId?: string,
    operation?: Deno.AtomicOperation,
  ) {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    const { value } = await super.create<T>(
      {
        ...fields,
        status: "queued",
        expires_at: Date.now() + RUN_EXPIRED_DURATION,
      },
      parentId,
      operation,
    );

    operation.enqueue({ action: "perform", runId: value.id }).enqueue(
      { action: "expire", runId: value.id },
      {
        delay: RUN_EXPIRED_DURATION,
      },
    );

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new DbCommitError();
      return { value };
    }

    return { operation, value };
  }

  static async cancel(old: RunObjectType, threadId: string) {
    const newRun = {
      ...old,
      status: "cancelling",
    } as RunObjectType;

    const { ok } = await kv
      .atomic()
      .enqueue({ action: "cancel", runId: (newRun as Meta).id })
      .set(this.genKvKey(threadId, (old as Meta).id), newRun)
      .commit();
    if (!ok) throw new DbCommitError();

    return newRun;
  }

  static async submitToolOutputs(
    run: RunObjectType,
    step: RunStepObjectType,
    outputs: ToolOutputType[],
  ) {
    const newRun = {
      ...run,
      status: "queued",
    } as RunObjectType;

    const atomicOp = kv
      .atomic()
      .enqueue({ action: "perform", runId: newRun.id })
      .enqueue(
        { action: "cancel", runId: newRun.id },
        { delay: RUN_EXPIRED_DURATION },
      )
      .set(this.genKvKey(run.thread_id, run.id), newRun);

    const toolCallsMap = (
      step.step_details as RunStepDetailsToolCallsObjectType
    ).tool_calls.reduce(
      (pre, cur) => ({
        ...pre,
        [cur.id]: cur,
      }),
      {},
    ) as { [key: string]: RunStepDetailsToolCallsFunctionObjectType };

    outputs.forEach((o) => {
      toolCallsMap[o.tool_call_id].function.output = o.output;
    });
    const newStep = {
      ...step,
      step_details: {
        ...step.step_details,
        tool_calls: Object.values(toolCallsMap),
      },
    } as RunStepObjectType;
    atomicOp.set(StepRepository.genKvKey(run.id, step.id), newStep);

    const { ok } = await atomicOp.commit();
    if (!ok) throw new DbCommitError();

    return newRun;
  }
}
