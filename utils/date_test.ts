import { assertMatch } from "$std/assert/mod.ts";
import { format } from "$/utils/date.ts";

Deno.test("Format date", () => {
  assertMatch(format(new Date()), /\d{4}-\d{2}-\d{2}/);
});
