import { NotImplemented } from "$/utils/errors.ts";

export class Base {
  protected static _fetch(_input: string, _init?: RequestInit): Promise<Response> {
    throw new NotImplemented("Retrieval.Base._fetch");
  }

  protected static open(_filePath: string): Promise<string> {
    throw new NotImplemented("Retrieval.Base._open");
  }

  protected static search(_query: string, _filePaths: string[]): Promise<string> {
    throw new NotImplemented("Retrieval.Base._search");
  }
}
