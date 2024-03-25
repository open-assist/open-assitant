import { assertThrows } from "$std/assert/mod.ts";
import { describe, it } from "$std/testing/bdd.ts";
import { Base } from "$/providers/llm/base.ts";
import { CreateChatCompletionRequestType } from "openai_schemas";

describe("LLM Base", () => {
  it("has unimplemented methods", () => {
    assertThrows(
      () => Base.createChatCompletion({} as CreateChatCompletionRequestType),
      "createChatCompletion",
    );
  });
});
