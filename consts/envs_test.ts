import { assertExists } from "@std/assert";
import { describe, it } from "$std/testing/bdd.ts";
import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_API_URL,
  ANTHROPIC_VERSION,
  FILE_DIR,
  GOOGLE_API_KEY,
  GOOGLE_API_URL,
  GOOGLE_API_VERSION,
  LLM_MODELS,
  LLM_MODELS_MAPPING,
  LLM_PROVIDER,
  LOG_LEVEL,
  MODEL_KNOWLEDGE_CUTOFF,
  NO_TENANT,
  ORG_FILES_SIZE_MAX,
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

describe("API variables", () => {
  it("The FILE_DIR const exists", () => {
    assertExists(FILE_DIR);
  });

  it("The ORG_FILES_SIZE_MAX const exists", () => {
    assertExists(ORG_FILES_SIZE_MAX);
  });

  it("The NO_TENANT const exists", () => {
    assertExists(NO_TENANT);
  });
});

describe("The variables for Google AI", () => {
  it("The GOOGLE_API_KEY const exists", () => {
    assertExists(GOOGLE_API_KEY);
  });

  it("The GOOGLE_API_URL const exists", () => {
    assertExists(GOOGLE_API_URL);
  });

  it("The GOOGLE_API_VERSION const exists", () => {
    assertExists(GOOGLE_API_VERSION);
  });
});
