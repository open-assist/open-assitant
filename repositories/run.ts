import {
  FunctionToolCall,
  RunObject,
  StepObject,
  ToolCall,
  ToolCallsDetail,
  ToolOutput,
} from "@open-schemas/zod/openai";
import { kv, Repository } from "$/repositories/base.ts";
import { StepRepository } from "$/repositories/step.ts";
import { Conflict } from "$/utils/errors.ts";
import { RUN_EXPIRED_DURATION, RUN_KEY, RUN_OBJECT, RUN_PREFIX, THREAD_KEY } from "$/consts/api.ts";
import { JobMessage } from "$/jobs/job.ts";
import { now } from "$/utils/date.ts";

export class RunRepository extends Repository<RunObject> {
  private static instance: RunRepository;

  private constructor() {
    super(RUN_PREFIX, RUN_OBJECT, THREAD_KEY, RUN_KEY, true);
  }

  public static getInstance(): RunRepository {
    if (!RunRepository.instance) {
      RunRepository.instance = new RunRepository();
    }
    return RunRepository.instance;
  }

  async createAndEnqueue(
    fields: Partial<RunObject>,
    parentId?: string,
    operation?: Deno.AtomicOperation,
  ) {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    const value = await this.create(
      {
        ...fields,
        status: "queued",
        expires_at: now() + RUN_EXPIRED_DURATION,
      },
      parentId,
      operation,
    );

    operation
      .enqueue({
        type: "run",
        args: JSON.stringify({ runId: value.id, action: "perform" }),
      })
      .enqueue(
        {
          type: "run",
          args: JSON.stringify({ runId: value.id, action: "expire" }),
        },
        {
          delay: RUN_EXPIRED_DURATION * 1000,
        },
      );

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new Conflict();
      return value;
    }

    return value;
  }

  async cancel(old: RunObject, threadId: string) {
    const newRun = {
      ...old,
      status: "cancelling",
    } as RunObject;

    await kv
      .atomic()
      .enqueue({
        type: "run",
        args: JSON.stringify({ runId: newRun.id, action: "cancel" }),
      } as JobMessage)
      .set(this.genKvKey(threadId, (old as RunObject).id), newRun)
      .commit();

    return newRun;
  }

  async submitToolOutputs(run: RunObject, step: StepObject, outputs: ToolOutput[]) {
    const newRun = {
      ...run,
      status: "queued",
      expires_at: now() + RUN_EXPIRED_DURATION,
    } as RunObject;

    const atomicOp = kv
      .atomic()
      .enqueue({
        type: "run",
        args: JSON.stringify({ runId: newRun.id, action: "perform" }),
      })
      .enqueue(
        {
          type: "run",
          args: JSON.stringify({ runId: newRun.id, action: "expire" }),
        },
        {
          delay: RUN_EXPIRED_DURATION * 1000,
        },
      )
      .set(this.genKvKey(run.thread_id, run.id), newRun);

    const toolCallsMap = (step.step_details as ToolCallsDetail).tool_calls.reduce(
      (pre, cur: ToolCall) => ({
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
    } as StepObject;
    atomicOp.set(StepRepository.getInstance().genKvKey(run.id, step.id), newStep);

    await atomicOp.commit();

    return newRun;
  }
}
