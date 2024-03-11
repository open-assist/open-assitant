import { defineConfig } from "$fresh/server.ts";
import * as log from "$std/log/mod.ts";
import { kv } from "$/repositories/_repository.ts";
import { isRunJobMessage, RunJob, RunJobMessage } from "$/jobs/run_job.ts";
import { isStepJobMessage, StepJob, StepJobMessage } from "$/jobs/step_job.ts";
import { LOG_LEVEL } from "$/utils/constants.ts";
import { LevelName } from "$std/log/levels.ts";

const logLevel = (Deno.env.get(LOG_LEVEL) || "INFO") as LevelName;
log.setup({
  handlers: { console: new log.ConsoleHandler(logLevel) },
  loggers: {
    default: {
      level: logLevel,
      handlers: ["console"],
    },
  },
});

kv.listenQueue(async (message: unknown) => {
  if (isRunJobMessage(message)) {
    await RunJob.execute(message as RunJobMessage);
  } else if (isStepJobMessage(message)) {
    await StepJob.execute(message as StepJobMessage);
  }
});

export default defineConfig({});
