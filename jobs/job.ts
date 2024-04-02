import { error } from "@std/log";
import { RunJob } from "$/jobs/run.ts";
import { StepJob } from "$/jobs/step.ts";

/**
 * Represents a job message containing information about a job to be executed.
 */
export interface JobMessage {
  /**
   * The type of the resource, either "run" or "step".
   */
  resourceType: "run" | "step";
  /**
   * The unique identifier of the resource.
   */
  resourceId: string;
  /**
   *  Optional arguments for the job.
   */
  args?: string;
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
    const { resourceId, resourceType, args } = message;
    switch (resourceType) {
      case "run":
        await RunJob.execute(resourceId, JSON.parse(args as string));
        break;
      case "step":
        await StepJob.execute(resourceId);
        break;
      default:
        error(`Unknown the resource type(${resourceType}) of job message.`);
    }
  }
}
