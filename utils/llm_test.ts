import { assertMatch } from "$std/assert/mod.ts";
import { genSystemFingerprint } from "$/utils/llm.ts";

Deno.test("The result format of genSystemFingerprint is correct.", async () => {
  const fp = await genSystemFingerprint();
  assertMatch(fp, /fp_[\w\d]{10}/);
});
