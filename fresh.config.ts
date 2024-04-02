import * as log from "@std/log";
import { defineConfig } from "$fresh/server.ts";
import { LOG_LEVEL } from "$/consts/envs.ts";
import { kv } from "$/repositories/_repository.ts";
import { Job, JobMessage } from "$/jobs/job.ts";

const logLevel = (Deno.env.get(LOG_LEVEL) || "INFO") as log.LevelName;
log.setup({
  handlers: { console: new log.ConsoleHandler(logLevel) },
  loggers: {
    default: {
      level: logLevel,
      handlers: ["console"],
    },
  },
});

kv.listenQueue(async (message: JobMessage) => {
  await Job.execute(message);
});

export default defineConfig({});
