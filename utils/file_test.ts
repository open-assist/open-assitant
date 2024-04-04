import { getFileDir, getOrgFilesSizeMax } from "$/utils/file.ts";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { DEFAULT_FILE_DIR, DEFAULT_ORG_FILES_SIZE_MAX } from "$/consts/api.ts";
import { FILE_DIR } from "$/consts/envs.ts";

describe("getFileDir", () => {
  it("gets default file dir when not set env", () => {
    assertEquals(getFileDir(), DEFAULT_FILE_DIR);
  });

  it("get file dir", () => {
    const tmp = "/tmp";
    Deno.env.set(FILE_DIR, tmp);
    assertEquals(getFileDir(), tmp);
  });
});

describe("getOrgFilesSizeMax", () => {
  it("returns the default max file size when env is not set", () => {
    assertEquals(getOrgFilesSizeMax(), DEFAULT_ORG_FILES_SIZE_MAX);
  });

  it("returns the max file size from env when set", () => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    Deno.env.set("ORG_FILES_SIZE_MAX", maxSize.toString());
    assertEquals(getOrgFilesSizeMax(), maxSize);
  });
});
