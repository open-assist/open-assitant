import { ulid } from "$std/ulid/mod.ts";

export function genUlid(prefix: string) {
  return `${prefix}_${ulid()}`;
}
