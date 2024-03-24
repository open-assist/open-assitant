import { assertExists } from "$std/assert/mod.ts";
import {
  MODEL_KNOWLEDGE_CUTOFF,
  LLM_PROVIDER,
  ANTHROPIC_API_KEY,
  ANTHROPIC_API_URL,
  ANTHROPIC_VERSION,
} from "$/consts/envs.ts";

Deno.test("The MODEL_KNOWLEDGE_CUTOFF const exists", () => {
  assertExists(MODEL_KNOWLEDGE_CUTOFF);
});

Deno.test("The LLM_PROVIDER const exists", () => {
  assertExists(LLM_PROVIDER);
});

Deno.test("The ANTHROPIC_API_KEY const exists", () => {
  assertExists(ANTHROPIC_API_KEY);
});

Deno.test("The ANTHROPIC_API_URL const exists", () => {
  assertExists(ANTHROPIC_API_URL);
});

Deno.test("The ANTHROPIC_VERSION const exists", () => {
  assertExists(ANTHROPIC_VERSION);
});
