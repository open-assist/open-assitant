/**
 * Returns the current Unix timestamp (the number of seconds since January 1, 1970 UTC).
 *
 * @returns {number} The current Unix timestamp.
 */
export function now(): number {
  return Math.floor(Date.now() / 1_000);
}
