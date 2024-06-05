import { describe, it } from "@std/testing/bdd";
import { assertExists } from "@std/assert";
import {
  ANTHROPIC,
  CALLS_STOP,
  CHAT_COMPLETION_PREFIX,
  CONTENT_BLOCK_DELTA,
  CONTENT_BLOCK_START,
  CONTENT_BLOCK_STOP,
  DONE_EVENT,
  MESSAGE_DETLA,
  MESSAGE_START,
  MESSAGE_STOP,
  OLLAMA,
  OPENAI,
  VERTEX_AI,
} from "$/consts/llm.ts";

describe("LLM consts", () => {
  it("CALLS_STOP exists", () => {
    assertExists(CALLS_STOP);
  });
});

describe("LLM provider consts", () => {
  it("ANTHROPIC exists", () => {
    assertExists(ANTHROPIC);
  });

  it("OLLAMA exists", () => {
    assertExists(OLLAMA);
  });

  it("OPENAI exists", () => {
    assertExists(OPENAI);
  });

  it("VERTEX_AI exists", () => {
    assertExists(VERTEX_AI);
  });
});

describe("Anthropic consts", () => {
  it("MESSAGE_START exists", () => {
    assertExists(MESSAGE_START);
  });

  it("MESSAGE_DETLA exists", () => {
    assertExists(MESSAGE_DETLA);
  });

  it("MESSAGE_STOP exists", () => {
    assertExists(MESSAGE_STOP);
  });

  it("CONTENT_BLOCK_START exists", () => {
    assertExists(CONTENT_BLOCK_START);
  });

  it("CONTENT_BLOCK_DELTA exists", () => {
    assertExists(CONTENT_BLOCK_DELTA);
  });

  it("CONTENT_BLOCK_STOP exists", () => {
    assertExists(CONTENT_BLOCK_STOP);
  });
});

describe("OpenAI consts", () => {
  it("CHAT_COMPLETION_PREFIX exists", () => {
    assertExists(CHAT_COMPLETION_PREFIX);
  });

  it("DONE_EVENT exists", () => {
    assertExists(DONE_EVENT);
  });
});
