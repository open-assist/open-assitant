import { InternalServerError } from "$/utils/errors.ts";
import * as log from "$std/log/mod.ts";
import { FILE_DIR, DEFAULT_FILE_DIR } from "$/utils/constants.ts";
import { ORG_FILES_SIZE_MAX } from "$/utils/constants.ts";
import { DEFAULT_ORG_FILES_SIZE_MAX } from "$/utils/constants.ts";

export function getFileDir() {
  return Deno.env.get(FILE_DIR) ?? DEFAULT_FILE_DIR;
}

export function getOrgFilesSizeMax() {
  const max = Deno.env.get(ORG_FILES_SIZE_MAX);
  if (max) {
    return parseInt(max);
  }
  return DEFAULT_ORG_FILES_SIZE_MAX;
}

export async function ensureDir(dir: string) {
  try {
    const fileInfo = await Deno.lstat(dir);
    if (!fileInfo.isDirectory) {
      log.error(`${dir} is not directory.`);
      throw new InternalServerError();
    }
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      await Deno.mkdir(dir);
    } else {
      log.error(e);
      throw new InternalServerError();
    }
  }
}
