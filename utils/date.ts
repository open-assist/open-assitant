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

/**
 * Formats a date as a string in the format "YYYY-MM-DD".
 *
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export function format(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
