import { StepObject } from "@open-schemas/zod/openai";
import { RunRepository } from "$/repositories/run.ts";
import { StepRepository } from "$/repositories/step.ts";
import { kv } from "$/repositories/base.ts";
import { now } from "$/utils/date.ts";

export class RunJob {
  /**
   * Perform the run job.
   *
   * @param runId The ID of run.
   * @param args The arguments for run job.
   */
  public static async execute(
    runId: string,
    args: { action: "perform" | "cancel" | "expire" },
  ) {
    const { action } = args;
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
    const runRepository = RunRepository.getInstance();
    // judge run status
    const run = await runRepository.findById(runId);
    if (run.status !== "queued") {
      return;
    }

    const runKey = runRepository.genKvKey(run.thread_id, run.id);
    // run status: queued -> in_progress, and create step
    const operation = kv.atomic();
    await StepRepository.getInstance().createWithThread(
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
        started_at: now(),
      });

    await operation.commit();
  }

  private static async updateStep(
    operation: Deno.AtomicOperation,
    runId: string,
    fields: Partial<StepObject>,
  ) {
    const stepRepository = StepRepository.getInstance();
    const step = await stepRepository.findOne(runId);
    if (step && step.status === "in_progress") {
      operation.set(stepRepository.genKvKey(runId, step.id), {
        ...step,
        ...fields,
      });
    }
  }

  private static async cancel(runId: string) {
    const runRepository = RunRepository.getInstance();
    const run = await runRepository.findById(runId);
    if (run.status === "cancelling") {
      const cancelledAt = now();

      const operation = kv.atomic();
      runRepository.update(
        run,
        {
          status: "cancelled",
          cancelled_at: cancelledAt,
        },
        run.thread_id,
      );

      await this.updateStep(operation, runId, {
        status: "cancelled",
        cancelled_at: cancelledAt,
      });

      await operation.commit();
    }
  }

  private static async expire(runId: string) {
    const runRepository = RunRepository.getInstance();
    const run = await runRepository.findById(runId);
    if (
      run.status === "queued" ||
      run.status === "in_progress" ||
      run.status === "requires_action"
    ) {
      const operation = kv.atomic();
      runRepository.update(
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

      await operation.commit();
    }
  }
}
