import type { RunObjectType, RunStepObjectType } from "openai_schemas";
import { DbCommitError } from "$/utils/errors.ts";
import { RunRepository } from "$/repositories/run.ts";
import { StepRepository } from "$/repositories/step.ts";
import { kv } from "$/repositories/_repository.ts";

export interface RunJobMessage {
  action: "perform" | "cancel" | "expire";
  runId: string;
}

export function isRunJobMessage(message: unknown) {
  return (
    (message as RunJobMessage).action !== undefined &&
    (message as RunJobMessage).runId !== undefined
  );
}

export class RunJob {
  /**
   * Perform the run job.
   *
   * @param message The rub job message.
   */
  public static async execute(message: RunJobMessage) {
    const { action, runId } = message;
    switch (action) {
      case "perform":
        await this.perform(runId);
        break;
      case "cancel":
        await this.cancel(runId);
        break;
      case "expire":
        await this.expire(runId);
        break;
    }
  }

  private static async perform(runId: string) {
    // judge run status
    const run = await RunRepository.findById<RunObjectType>(runId);
    if (run.status !== "queued") {
      return;
    }

    const runKey = RunRepository.genKvKey(run.thread_id, run.id);
    // run status: queued -> in_progress, and create step
    const operation = kv.atomic();
    const { value: step } = await StepRepository.createWithThread(
      {
        assistant_id: run.assistant_id,
        thread_id: run.thread_id,
        run_id: run.id,
        status: "in_progress",
      },
      run.id,
      run.thread_id,
      operation,
    );
    operation
      .set(runKey, {
        ...run,
        status: "in_progress",
        started_at: Date.now(),
      })
      .enqueue({ stepId: step.id });

    const { ok } = await operation.commit();
    if (!ok) throw new DbCommitError();
  }

  private static async updateStep(
    operation: Deno.AtomicOperation,
    runId: string,
    fields: Partial<RunStepObjectType>,
  ) {
    const step = await StepRepository.findOne<RunStepObjectType>(runId);
    if (step && step.status === "in_progress") {
      operation.set(StepRepository.genKvKey(runId, step.id), {
        ...step,
        ...fields,
      } as RunStepObjectType);
    }
  }

  private static async cancel(runId: string) {
    const run = await RunRepository.findById<RunObjectType>(runId);
    if (run.status === "cancelling") {
      const now = Date.now();

      const { operation } = RunRepository.updateWithoutCommit<RunObjectType>(
        run,
        {
          status: "cancelled",
          cancelled_at: now,
        },
        run.thread_id,
      );

      await this.updateStep(operation, runId, {
        status: "cancelled",
        cancelled_at: now,
      });

      const { ok } = await operation.commit();
      if (!ok) {
        console.log("[-] cancel run(%s) failed.", runId);
      }
    }
  }

  private static async expire(runId: string) {
    const run = await RunRepository.findById<RunObjectType>(runId);
    if (
      run.status === "queued" ||
      run.status === "in_progress" ||
      run.status === "requires_action"
    ) {
      const { operation } = RunRepository.updateWithoutCommit<RunObjectType>(
        run,
        {
          status: "expired",
        },
        run.thread_id,
      );

      await this.updateStep(operation, runId, {
        status: "expired",
        expired_at: Date.now(),
      });

      const { ok } = await operation.commit();
      if (!ok) {
        console.log("[-] expire run(%s) failed.", runId);
      }
    }
  }
}
