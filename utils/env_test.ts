import { assertEquals, assertThrows } from "$std/assert/mod.ts";
import { describe, it } from "$std/testing/bdd.ts";
import { getEnv } from "$/utils/env.ts";
import { NotSet } from "$/utils/errors.ts";

describe("getEnv", () => {
  it("gets environment variable", () => {
    const variable = "variable";
    Deno.env.set(variable, variable);

    assertEquals(getEnv(variable), variable);

    Deno.env.delete(variable);
  });

  it("throws error if environment variable is not set", () => {
    const variable = "nonexistenv";
    assertThrows(() => getEnv(variable), NotSet, variable);
  });

  it("does not throw error if environment variable is not set", () => {
    assertEquals(getEnv("nonexistenv", false), undefined);
  });
});
