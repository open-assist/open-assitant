import { assertExists } from "@std/assert";
import { describe, it } from "$std/testing/bdd.ts";
import {
  LOG_LEVEL,
  MODEL_KNOWLEDGE_CUTOFF,
  LLM_PROVIDER,
  LLM_MODELS,
  LLM_MODELS_MAPPING,
  ANTHROPIC_API_KEY,
  ANTHROPIC_API_URL,
  ANTHROPIC_VERSION,
} from "$/consts/envs.ts";

describe("Log variables", () => {
  it("The LOG_LEVEL const exists", () => {
    assertExists(LOG_LEVEL);
  });
});

describe("LLM variables", () => {
  it("The MODEL_KNOWLEDGE_CUTOFF const exists", () => {
    assertExists(MODEL_KNOWLEDGE_CUTOFF);
  });

  it("The LLM_PROVIDER const exists", () => {
    assertExists(LLM_PROVIDER);
  });

  it("The LLM_MODELS const exists", () => {
    assertExists(LLM_MODELS);
  });

  it("The LLM_MODELS_MAPPING const exists", () => {
    assertExists(LLM_MODELS_MAPPING);
  });
});

describe("Anthropic variables", () => {
  it("The ANTHROPIC_API_KEY const exists", () => {
    assertExists(ANTHROPIC_API_KEY);
  });

  it("The ANTHROPIC_API_URL const exists", () => {
    assertExists(ANTHROPIC_API_URL);
  });

  it("The ANTHROPIC_VERSION const exists", () => {
    assertExists(ANTHROPIC_VERSION);
  });
});
