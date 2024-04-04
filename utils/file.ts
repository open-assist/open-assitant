import { InternalServerError } from "$/utils/errors.ts";
import * as log from "$std/log/mod.ts";
import { FILE_DIR, ORG_FILES_SIZE_MAX } from "$/consts/envs.ts";
import { DEFAULT_ORG_FILES_SIZE_MAX, DEFAULT_FILE_DIR } from "$/consts/api.ts";

/**
 * Get the directory path for storing files.
 *
 * @returns The directory path for storing files. If the environment variable FILE_DIR is set, it
 *   will be used. Otherwise, the default value DEFAULT_FILE_DIR will be used.
 */
export function getFileDir() {
  return Deno.env.get(FILE_DIR) ?? DEFAULT_FILE_DIR;
}

/**
 * Get the maximum allowed size for organization files.
 *
 * @returns The maximum allowed size for organization files in bytes. If the environment variable
 *   ORG_FILES_SIZE_MAX is set, it will be parsed as an integer and used. Otherwise, the default
 *   value DEFAULT_ORG_FILES_SIZE_MAX will be used.
 */
export function getOrgFilesSizeMax() {
  const max = Deno.env.get(ORG_FILES_SIZE_MAX);
  if (max) {
    return parseInt(max);
  }
  return DEFAULT_ORG_FILES_SIZE_MAX;
}

/**
 * Ensure that a directory exists. If the directory does not exist, it will be created.
 *
 * @param dir The path of the directory to ensure.
 * @throws {InternalServerError} If the specified path is not a directory or if an error occurs
 *   while creating the directory.
 */
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
