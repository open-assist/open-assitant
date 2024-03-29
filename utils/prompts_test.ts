import { assertExists } from "@std/assert";
import {
  ASSISTANT_PROMPT,
  MULTIMODAL_MODEL_PROMPT,
  TOOLS_PROMPT,
  CODE_INTERPRETER_TOOLS_PROMPT,
  FUNCTION_TOOLS_PROMPT,
  RETRIEVAL_TOOLS_PROMPT,
  USER_PROMPT,
} from "$/utils/prompts.ts";

Deno.test("Assistant prompt exists", () => {
  assertExists(ASSISTANT_PROMPT);
});

Deno.test("Multimodal model prompt exists", () => {
  assertExists(MULTIMODAL_MODEL_PROMPT);
});

Deno.test("Tools prompt exists", () => {
  assertExists(TOOLS_PROMPT);
});

Deno.test("Code interpreter tools prompt exists", () => {
  assertExists(CODE_INTERPRETER_TOOLS_PROMPT);
});

Deno.test("Function tools prompt exists", () => {
  assertExists(FUNCTION_TOOLS_PROMPT);
});

Deno.test("Retrieval tools prompt exists", () => {
  assertExists(RETRIEVAL_TOOLS_PROMPT);
});

Deno.test("The USER_PROMPT exists", () => {
  assertExists(USER_PROMPT);
});
