import * as log from "$std/log/mod.ts";

// deno-lint-ignore no-explicit-any
export function logRejectionReason(reason: any) {
  if ("" + reason === "resource closed") {
    return;
  }
  log.error(`[Promise] resposne error: ${reason}`);
}
