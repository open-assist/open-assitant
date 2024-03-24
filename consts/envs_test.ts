import { assertExists } from "$std/assert/mod.ts";
import { MODEL_KNOWLEDGE_CUTOFF } from "$/consts/envs.ts";

Deno.test("The MODEL_KNOWLEDGE_CUTOFF const exists", () => {
  assertExists(MODEL_KNOWLEDGE_CUTOFF);
});
