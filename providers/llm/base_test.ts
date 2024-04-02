import { assertThrows } from "@std/assert";
import { describe, it } from "$std/testing/bdd.ts";
import { Base } from "$/providers/llm/base.ts";
import { CreateChatCompletionRequest } from "@open-schemas/zod/openai";

describe("LLM Base", () => {
  it("has unimplemented method createChatCompletion", () => {
    assertThrows(
      () => Base.createChatCompletion({} as CreateChatCompletionRequest),
      "createChatCompletion",
    );
  });

  it("has unimplemented method runStep", () => {
    assertThrows(() => Base.runStep("", [], []), "runStep");
  });
});
