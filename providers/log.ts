import * as log from "$std/log/mod.ts";
import { InternalServerError } from "$/utils/errors.ts";

// deno-lint-ignore no-explicit-any
export function logRejectionReason(reason: any) {
  if ("" + reason === "resource closed") {
    return;
  }
  log.error(`[Promise] resposne error: ${reason}`);
}

export function logResponseError(response: Response) {
  if (response.status >= 400) {
    response.json().then((body) => {
      log.error(
        `[client] fetch with response status: ${response.status}, body: ${JSON.stringify(body)}`,
      );
    });
    throw new InternalServerError();
  }
  return response;
}
