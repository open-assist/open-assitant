import { FileObject } from "@open-schemas/zod/openai";
import * as log from "$std/log/mod.ts";
import { extname } from "$std/path/mod.ts";
import { Repository, kv } from "$/repositories/base.ts";
import { FILE_KEY, FILE_OBJECT, FILE_PREFIX, ORGANIZATION, FILE_INFO_KEY } from "$/consts/api.ts";
import { FileInfo } from "$/schemas/file_info.ts";
import { ensureDir, getFileDir } from "$/utils/file.ts";

export class FileRepository extends Repository<FileObject> {
  private static instance: FileRepository;

  private constructor() {
    super(FILE_PREFIX, FILE_OBJECT, ORGANIZATION, FILE_KEY, true);
  }

  public static getInstance(): FileRepository {
    if (!FileRepository.instance) {
      FileRepository.instance = new FileRepository();
    }
    return FileRepository.instance;
  }

  async sumFileSize(org: string) {
    const files = await this.findAll(org);
    return files.reduce((pre, cur) => pre + cur.bytes, 0);
  }

  async findByPurpose(organization: string, purpose?: string) {
    const files = await this.findAll(organization);
    if (purpose) {
      return files.filter((f) => f.purpose === purpose);
    }
    return files;
  }

  genInfoKey(organization: string, id: string) {
    return [ORGANIZATION, organization, FILE_INFO_KEY, id];
  }

  // async createWithInfo(
  //   fields: Partial<FileObject>,
  //   info: FileInfo,
  //   organization: string,
  //   operation: Deno.AtomicOperation,
  // ) {
  //   const file = await this.create(fields, organization, operation);
  //   const fileInfoKey = this.genInfoKey(organization, file.id);
  //   operation.check({ key: fileInfoKey, versionstamp: null }).set(fileInfoKey, info);
  //   return file;
  // }

  async createWithFile(fields: Partial<FileObject>, organization: string, file: File) {
    const operation = kv.atomic();
    const fileObject = await this.create(fields, organization, operation);

    const filePath = `${fileObject.id}${extname(file.name)}`;
    const fileInfoKey = this.genInfoKey(organization, fileObject.id);
    operation.check({ key: fileInfoKey, versionstamp: null }).set(fileInfoKey, {
      file_path: filePath,
      file_type: file.type,
    } as FileInfo);

    const dirPath = `${getFileDir()}/${organization}`;
    await ensureDir(dirPath);
    Deno.writeFile(`${dirPath}/${filePath}`, file.stream(), {
      create: true,
    });

    await operation.commit();

    return fileObject;
  }

  async destoryWithFile(id: string, organization: string) {
    const operation = kv.atomic();
    const fileInfoKey = this.genInfoKey(organization, id);
    operation.delete(fileInfoKey);
    const fileInfo = (await kv.get<FileInfo>(fileInfoKey)).value;
    await this.destory(id, organization, operation);
    await operation.commit();
    try {
      await Deno.remove(`${getFileDir()}/${organization}/${fileInfo?.file_path}`);
    } catch (e) {
      log.error(`[FileRepository] destoryWithFile: ${e}`);
    }
  }

  async findByIds(ids: string[]) {
    const secondaryKeys = ids.map((id) => this.genKvKey(undefined, id));
    const keys = (await kv.getMany(secondaryKeys)).map((e) => e.value as Deno.KvKey);
    return (await kv.getMany(keys)).map((e) => e.value as FileObject);
  }

  async findInfoById(id: string) {
    const infoKey = this.genInfoKey("#org", id);
    return (await kv.get<FileInfo>(infoKey)).value;
  }

  async findInfosByIds(ids: string[]) {
    const infoKeys = ids.map((id) => this.genInfoKey("#org", id));
    return (await kv.getMany(infoKeys)).map((e) => e.value as FileInfo);
  }
}
