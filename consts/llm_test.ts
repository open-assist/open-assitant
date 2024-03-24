import { assertExists } from "$std/assert/mod.ts";
import { TOOL_STOP } from "$/consts/llm.ts";

Deno.test("The TOOL_STOP const exists", () => {
  assertExists(TOOL_STOP);
});
