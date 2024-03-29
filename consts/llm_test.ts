import { describe, it } from "@std/testing/bdd";
import { assertExists } from "@std/assert";
import {
  TOOL_STOP,
  ANTHROPIC,
  OLLAMA,
  OPENAI,
  VERTEX_AI,
  DEFAULT_ANTHROPIC_API_URL,
  DEFAULT_ANTHROPIC_VERSION,
  MESSAGE_START,
  MESSAGE_DETLA,
  MESSAGE_STOP,
  CONTENT_BLOCK_START,
  CONTENT_BLOCK_DELTA,
  CONTENT_BLOCK_STOP,
  CHAT_COMPLETION_PREFIX,
  DONE_EVENT,
} from "$/consts/llm.ts";

describe("LLM consts", () => {
  it("TOOL_STOP exists", () => {
    assertExists(TOOL_STOP);
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
  it("DEFAULT_ANTHROPIC_API_URL exists", () => {
    assertExists(DEFAULT_ANTHROPIC_API_URL);
  });

  it("DEFAULT_ANTHROPIC_VERSION exists", () => {
    assertExists(DEFAULT_ANTHROPIC_VERSION);
  });

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
