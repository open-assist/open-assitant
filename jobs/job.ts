import { error } from "$std/log/mod.ts";
import { RunJob } from "$/jobs/run.ts";
import { StepJob } from "$/jobs/step.ts";
import { RetrievalJob } from "$/jobs/retrieval.ts";
import { CodeInterpreterJob } from "$/jobs/code_interpreter.ts";
import { VectorStoreJob } from "$/jobs/vector_store.ts";
import { FileJob } from "$/jobs/file.ts";

/**
 * Represents a job message containing information about a job to be executed.
 */
export interface JobMessage {
  /**
   * Optional arguments for the job.
   */
  args: string;
  /**
   * The type of job.
   */
  type:
    | "run"
    | "step"
    | "retrieval"
    | "code_interpreter"
    | "file"
    | "vector_store";
}

/**
 * A class representing a job that can be executed.
 */
export class Job {
  /**
   * Executes the job based on the provided job message. Log error if an unknown resource type is
   * encountered.
   *
   * @param  message - The job message containing the resource type, resource ID, and optional arguments.
   * @returns A promise that resolves when the job execution is complete.
   */
  public static async execute(message: JobMessage) {
    const { args, type } = message;
    const params = JSON.parse(args as string);
    switch (type) {
      case "run":
        await RunJob.execute(params);
        break;
      case "step":
        await StepJob.execute(params);
        break;
      case "retrieval":
        await RetrievalJob.execute(params);
        break;
      case "code_interpreter":
        await CodeInterpreterJob.execute(params);
        break;
      case "file":
        await FileJob.execute(params);
        break;
      case "vector_store":
        await VectorStoreJob.execute(params);
        break;
      default:
        error(`Unknown the type(${type}) of job message.`);
    }
  }
}
