import { assertEquals, assertMatch, assertThrows } from "$std/assert/mod.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import { LLM_PROVIDER, LLM_MODELS, LLM_MODELS_MAPPING } from "$/consts/envs.ts";
import {
  genSystemFingerprint,
  getModels,
  getModelsMapping,
  getProvider,
} from "$/utils/llm.ts";
import { ConfigurationNotSet } from "$/utils/errors.ts";

describe("genSystemFingerprint", () => {
  it("returns a string matching the expected format", async () => {
    const fingerprint = await genSystemFingerprint();
    assertMatch(fingerprint, /^fp_[\w\d]{10}$/);
  });
});

describe("getProvider", () => {
  const provider = "provider";

  beforeEach(() => {
    Deno.env.set(LLM_PROVIDER, provider);
  });

  afterEach(() => {
    Deno.env.delete(LLM_PROVIDER);
  });

  it("can get valid provider", () => {
    assertEquals(getProvider(), provider);
  });

  it("throws erorr when env var is not set", () => {
    Deno.env.delete(LLM_PROVIDER);
    assertThrows(() => getProvider(), ConfigurationNotSet, LLM_PROVIDER);
  });
});

describe("getModels", () => {
  const models = "model1,model2,model3";

  beforeEach(() => {
    Deno.env.set(LLM_MODELS, models);
  });

  afterEach(() => {
    Deno.env.delete(LLM_MODELS);
  });

  it("can get valid models", () => {
    assertEquals(getModels(), models.split(","));
  });

  it("throws error when env var is not set", () => {
    Deno.env.delete(LLM_MODELS);
    assertThrows(() => getModels(), ConfigurationNotSet, LLM_MODELS);
  });
});

describe("getModelsMapping", () => {
  const modelsMapping = {
    model1: "mapping1",
    model2: "mapping2",
    model3: "mapping3",
  };
  const modelsMappingEnv = "model1->mapping1,model2->mapping2,model3->mapping3";

  beforeEach(() => {
    Deno.env.set(LLM_MODELS_MAPPING, modelsMappingEnv);
  });

  afterEach(() => {
    Deno.env.delete(LLM_MODELS_MAPPING);
  });

  it("can get valid models mapping", () => {
    assertEquals(getModelsMapping(), modelsMapping);
  });

  it("gets undifined when env var is not set", () => {
    Deno.env.delete(LLM_MODELS_MAPPING);
    assertEquals(getModelsMapping(), undefined);
  });
});
