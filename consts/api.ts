export const TEXT_EVENT_STREAM_HEADER = {
  "Content-Type": "text/event-stream",
};
export const APPLICATION_JSON_HEADER = {
  "Content-Type": "application/json",
};

export const ORGANIZATION = "organization";

export const ASSISTANT_KEY = "assistant";
export const ASSISTANT_OBJECT = "assistant";
export const ASSISTANT_PREFIX = "asst";

export const THREAD_KEY = "thread";
export const THREAD_OBJECT = "thread";
export const THREAD_PREFIX = "thrd";

export const MESSAGE_KEY = "message";
export const MESSAGE_OBJECT = "thread.message";
export const MESSAGE_PREFIX = "msg";

export const RUN_KEY = "run";
export const RUN_OBJECT = "thread.run";
export const RUN_PREFIX = "run";

export const STEP_KEY = "step";
export const STEP_OBJECT = "thread.run.step";
export const STEP_PREFIX = "step";

export const FILE_KEY = "file";
export const FILE_OBJECT = "file";
export const FILE_PREFIX = "file";

export const FILE_INFO_KEY = "file_info";

// 10 minutes, unit: second
export const RUN_EXPIRED_DURATION = 10 * 60;

// files api
export const DEFAULT_FILE_DIR = "/tmp/assistant";
export const DEFAULT_ORG_FILES_SIZE_MAX = 100_000_000_000; // 100GB
