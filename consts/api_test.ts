import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import {
  TEXT_EVENT_STREAM_HEADER,
  ORGANIZATION,
  ASSISTANT_KEY,
  ASSISTANT_OBJECT,
  ASSISTANT_PREFIX,
  THREAD_KEY,
  THREAD_OBJECT,
  THREAD_PREFIX,
  MESSAGE_KEY,
  MESSAGE_OBJECT,
  MESSAGE_PREFIX,
  RUN_KEY,
  RUN_OBJECT,
  RUN_PREFIX,
  STEP_KEY,
  STEP_OBJECT,
  STEP_PREFIX,
  FILE_KEY,
  FILE_OBJECT,
  FILE_PREFIX,
  RUN_EXPIRED_DURATION,
  DEFAULT_FILE_DIR,
  DEFAULT_ORG_FILES_SIZE_MAX,
} from "$/consts/api.ts";

describe("HTTP Headers", () => {
  it("has TEXT_EVENT_STREAM_HEADER const", () => {
    assertEquals(TEXT_EVENT_STREAM_HEADER["Content-Type"], "text/event-stream");
  });
});

describe("Model consts", () => {
  it("has ORGANIZATION const", () => {
    assertEquals(ORGANIZATION, "organization");
  });

  it("has ASSISTANT_KEY const", () => {
    assertEquals(ASSISTANT_KEY, "assistant");
  });

  it("has ASSISTANT_OBJECT const", () => {
    assertEquals(ASSISTANT_OBJECT, "assistant");
  });

  it("has ASSISTANT_PREFIX const", () => {
    assertEquals(ASSISTANT_PREFIX, "asst");
  });

  it("has THREAD_KEY const", () => {
    assertEquals(THREAD_KEY, "thread");
  });

  it("has THREAD_OBJECT const", () => {
    assertEquals(THREAD_OBJECT, "thread");
  });

  it("has THREAD_PREFIX const", () => {
    assertEquals(THREAD_PREFIX, "thrd");
  });

  it("has MESSAGE_KEY const", () => {
    assertEquals(MESSAGE_KEY, "message");
  });

  it("has MESSAGE_OBJECT const", () => {
    assertEquals(MESSAGE_OBJECT, "thread.message");
  });

  it("has MESSAGE_PREFIX const", () => {
    assertEquals(MESSAGE_PREFIX, "msg");
  });

  it("has RUN_KEY const", () => {
    assertEquals(RUN_KEY, "run");
  });

  it("has RUN_OBJECT const", () => {
    assertEquals(RUN_OBJECT, "thread.run");
  });

  it("has RUN_PREFIX const", () => {
    assertEquals(RUN_PREFIX, "run");
  });

  it("has STEP_KEY const", () => {
    assertEquals(STEP_KEY, "step");
  });

  it("has STEP_OBJECT const", () => {
    assertEquals(STEP_OBJECT, "thread.run.step");
  });

  it("has STEP_PREFIX const", () => {
    assertEquals(STEP_PREFIX, "step");
  });

  it("has FILE_KEY const", () => {
    assertEquals(FILE_KEY, "file");
  });

  it("has FILE_OBJECT const", () => {
    assertEquals(FILE_OBJECT, "file");
  });

  it("has FILE_PREFIX const", () => {
    assertEquals(FILE_PREFIX, "file");
  });
});

describe("API consts", () => {
  it("has RUN_EXPIRED_DURATION const", () => {
    assertEquals(RUN_EXPIRED_DURATION, 600);
  });

  it("has DEFAULT_FILE_DIR const", () => {
    assertEquals(DEFAULT_FILE_DIR, "/tmp/assistant");
  });

  it("has DEFAULT_ORG_FILES_SIZE_MAX const", () => {
    assertEquals(DEFAULT_ORG_FILES_SIZE_MAX, 100_000_000_000);
  });
});
