import * as log from "$std/log/mod.ts";
import { InternalServerError } from "$/utils/errors.ts";

/**
 * Logs the reason for a rejected promise.
 * Ignores the reason if it is "resource closed".
 *
 * @param reason The reason for the rejected promise.
 */
// deno-lint-ignore no-explicit-any
export function logRejectionReason(reason: any) {
  if ("" + reason === "resource closed") {
    return;
  }
  log.error(`[Promise] resposne error: ${reason}`);
}

/**
 * Logs the response error if the response status is greater than or equal to 400.
 * Throws an InternalServerError if the response status indicates an error.
 *
 * @param response The response object to log the error for.
 * @returns The original response if no error occurred.
 * @throws {InternalServerError} If the response status indicates an error.
 */
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
