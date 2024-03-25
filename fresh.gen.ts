// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.ts";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $index from "./routes/index.ts";
import * as $internal_middleware from "./routes/internal/_middleware.ts";
import * as $internal_tokens_token_id_ from "./routes/internal/tokens/[token_id].ts";
import * as $internal_tokens_index from "./routes/internal/tokens/index.ts";
import * as $v1_middleware from "./routes/v1/_middleware.ts";
import * as $v1_assistants_assistant_id_ from "./routes/v1/assistants/[assistant_id].ts";
import * as $v1_assistants_index from "./routes/v1/assistants/index.ts";
import * as $v1_chat_completions from "./routes/v1/chat/completions.ts";
import * as $v1_files_file_id_ from "./routes/v1/files/[file_id].ts";
import * as $v1_files_index from "./routes/v1/files/index.ts";
import * as $v1_models_index from "./routes/v1/models/index.ts";
import * as $v1_threads_thread_id_ from "./routes/v1/threads/[thread_id].ts";
import * as $v1_threads_thread_id_messages_message_id_ from "./routes/v1/threads/[thread_id]/messages/[message_id].ts";
import * as $v1_threads_thread_id_messages_index from "./routes/v1/threads/[thread_id]/messages/index.ts";
import * as $v1_threads_thread_id_runs_run_id_ from "./routes/v1/threads/[thread_id]/runs/[run_id].ts";
import * as $v1_threads_thread_id_runs_run_id_cancel from "./routes/v1/threads/[thread_id]/runs/[run_id]/cancel.ts";
import * as $v1_threads_thread_id_runs_run_id_steps_step_id_ from "./routes/v1/threads/[thread_id]/runs/[run_id]/steps/[step_id].ts";
import * as $v1_threads_thread_id_runs_run_id_steps_index from "./routes/v1/threads/[thread_id]/runs/[run_id]/steps/index.ts";
import * as $v1_threads_thread_id_runs_run_id_submit_tool_outputs from "./routes/v1/threads/[thread_id]/runs/[run_id]/submit_tool_outputs.ts";
import * as $v1_threads_thread_id_runs_index from "./routes/v1/threads/[thread_id]/runs/index.ts";
import * as $v1_threads_index from "./routes/v1/threads/index.ts";

import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.ts": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/index.ts": $index,
    "./routes/internal/_middleware.ts": $internal_middleware,
    "./routes/internal/tokens/[token_id].ts": $internal_tokens_token_id_,
    "./routes/internal/tokens/index.ts": $internal_tokens_index,
    "./routes/v1/_middleware.ts": $v1_middleware,
    "./routes/v1/assistants/[assistant_id].ts": $v1_assistants_assistant_id_,
    "./routes/v1/assistants/index.ts": $v1_assistants_index,
    "./routes/v1/chat/completions.ts": $v1_chat_completions,
    "./routes/v1/files/[file_id].ts": $v1_files_file_id_,
    "./routes/v1/files/index.ts": $v1_files_index,
    "./routes/v1/models/index.ts": $v1_models_index,
    "./routes/v1/threads/[thread_id].ts": $v1_threads_thread_id_,
    "./routes/v1/threads/[thread_id]/messages/[message_id].ts":
      $v1_threads_thread_id_messages_message_id_,
    "./routes/v1/threads/[thread_id]/messages/index.ts":
      $v1_threads_thread_id_messages_index,
    "./routes/v1/threads/[thread_id]/runs/[run_id].ts":
      $v1_threads_thread_id_runs_run_id_,
    "./routes/v1/threads/[thread_id]/runs/[run_id]/cancel.ts":
      $v1_threads_thread_id_runs_run_id_cancel,
    "./routes/v1/threads/[thread_id]/runs/[run_id]/steps/[step_id].ts":
      $v1_threads_thread_id_runs_run_id_steps_step_id_,
    "./routes/v1/threads/[thread_id]/runs/[run_id]/steps/index.ts":
      $v1_threads_thread_id_runs_run_id_steps_index,
    "./routes/v1/threads/[thread_id]/runs/[run_id]/submit_tool_outputs.ts":
      $v1_threads_thread_id_runs_run_id_submit_tool_outputs,
    "./routes/v1/threads/[thread_id]/runs/index.ts":
      $v1_threads_thread_id_runs_index,
    "./routes/v1/threads/index.ts": $v1_threads_index,
  },
  islands: {},
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
