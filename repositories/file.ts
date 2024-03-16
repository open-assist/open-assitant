import { Repository } from "$/repositories/_repository.ts";
import type { FileObjectType } from "$/schemas/file.ts";

export class FileRepository extends Repository {
  static idPrefix = "file";
  static object = "file";
  static parent = "organization";
  static self = "file";

  static async sumFileSize(org: string) {
    const files = await this.findAll<FileObjectType>(org);
    return files.reduce((pre, cur) => pre + cur.bytes, 0);
  }

  // private static genFileSizeKey(org: string) {
  //   return [this.parent, org, "file_size"];
  // }

  // static async createWithBytes(
  //   fields: Partial<FileObjectType>,
  //   organization: string,
  // ) {
  //   const operation = kv.atomic();
  //   const { value } = await this.create<FileObjectType>(
  //     fields,
  //     organization,
  //     operation,
  //   );
  //   operation.sum(
  //     [this.parent, organization, "file_size"],
  //     BigInt(value.bytes),
  //   );

  //   const { ok } = await operation.commit();
  //   if (!ok) throw new DbCommitError();
  //   return { value };
  // }

  // static async destoryWithBytes(id: string, org: string, bytes: number) {
  //   const operation = kv.atomic();
  //   this.destory(id, org, operation);

  //   operation.sum(this.genFileSizeKey(org), -BigInt(bytes));
  // }
}
