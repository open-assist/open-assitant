import { NotImplemented } from "$/utils/errors.ts";

export class Base {
  protected static _fetch(_input: string, _init?: RequestInit): Promise<Response> {
    throw new NotImplemented("Retrieval.Base.fetch");
  }

  protected static open(_filePath: string): Promise<string> {
    throw new NotImplemented("Retrieval.Base.open");
  }

  protected static search(_query: string, _filePaths: string[]): Promise<string> {
    throw new NotImplemented("Retrieval.Base.search");
  }

  protected static create_file_job(
    _org: string,
    _id: string,
    _name: string,
    _type: string,
  ): Promise<void> {
    throw new NotImplemented("Retrieval.Base.create_file_job");
  }

  static delete_file_index(_org: string, _id: string): Promise<void> {
    throw new NotImplemented("Retrieval.Base.delete_file_index");
  }
}
