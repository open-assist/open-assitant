import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { TEXT_EVENT_STREAM_HEADER } from "$/consts/api.ts";

describe("TEXT_EVENT_STREAM_HEADER", () => {
  it("is a valid http header", () => {
    assertEquals(TEXT_EVENT_STREAM_HEADER["Content-Type"], "text/event-stream");
  });
});
