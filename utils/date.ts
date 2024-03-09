/**
 * Returns the current Unix timestamp (the number of seconds since January 1, 1970 UTC).
 *
 * @returns {number} The current Unix timestamp.
 */
export function now(): number {
  return Math.floor(Date.now() / 1_000);
}

export function toTimestamp(value: string) {
  return Math.floor(new Date(value).getTime() / 1_000);
}
