import { describe, it, afterEach } from "$std/testing/bdd.ts";
import { assertEquals, assertMatch } from "$std/assert/mod.ts";
import { LLM_PROVIDER } from "$/consts/envs.ts";
import { getClient } from "$/providers/llm/client.ts";
import { EnvNotSet } from "$/utils/errors.ts";

describe("LLM getClient", () => {
  afterEach(() => {
    Deno.env.delete(LLM_PROVIDER);
  });

  it("gets anthropic client", async () => {
    Deno.env.set(LLM_PROVIDER, "anthropic");

    const client = await getClient();
    assertEquals(client.name, "Anthropic");
  });

  it("throw EnvNotSet when not set LLM_PROVIDER", async () => {
    try {
      await getClient();
    } catch (e) {
      assertEquals(e.constructor, EnvNotSet);
    }
  });

  it("throw error for unknown provider", async () => {
    Deno.env.set(LLM_PROVIDER, "xxx");

    try {
      await getClient();
    } catch (e) {
      assertMatch(e.message, /xxx/);
    }
  });
});
