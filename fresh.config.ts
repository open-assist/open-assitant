import { defineConfig } from "$fresh/server.ts";
import { load } from "$std/dotenv/mod.ts";
import { kv } from "$/repositories/_repository.ts";
import { isRunJobMessage, RunJob, RunJobMessage } from "$/jobs/run_job.ts";
import { isStepJobMessage, StepJob, StepJobMessage } from "$/jobs/step_job.ts";

export const env = await load();

kv.listenQueue(async (message: unknown) => {
  if (isRunJobMessage(message)) {
    await RunJob.execute(message as RunJobMessage);
  } else if (isStepJobMessage(message)) {
    await StepJob.execute(message as StepJobMessage);
  }
});

export default defineConfig({});
