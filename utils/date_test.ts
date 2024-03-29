import { assertMatch, assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { format, now, toTimestamp } from "$/utils/date.ts";

describe("Date utils", () => {
  it("Format date", () => {
    assertMatch(format(new Date()), /\d{4}-\d{2}-\d{2}/);
  });

  it("Current unix timestamp in seconds", () => {
    assertMatch(`${now()}`, /\d{10}/);
  });

  it("Convert date to unix timestamp in seconds", () => {
    const timestamp = toTimestamp("2023-01-01T00:00:00Z");
    assertEquals(timestamp, 1672531200);
  });
});
