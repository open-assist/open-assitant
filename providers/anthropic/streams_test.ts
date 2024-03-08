import { MessageTransformStream } from "$/providers/anthropic/streams.ts";
import { assertNotEquals } from "$std/assert/mod.ts";

Deno.test("transform message event to completion chunk", async () => {
  const stream = new MessageTransformStream();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [{ role: "user", content: "Hello, world" }],
      stream: true,
    }),
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") as string,
    },
  });

  console.log(
    "[MTS]",
    `${res.status} ${res.statusText} ${res.headers.get("content-type")}`,
  );
  res.body?.pipeTo(stream.writable).catch((e) => {
    if ("" + e === "resource closed") {
      return;
    }
    console.log(`Error watching: ${e}`);
  });

  console.log("[MTS] starting");
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    const event = new TextDecoder().decode(value);
    console.log("[MTS]", event);

    assertNotEquals(event, "");

    if (done) {
      break;
    }
  }
});
