import { FileObject } from "@open-schemas/zod/openai";
import { Repository } from "$/repositories/base.ts";
import { FILE_KEY, FILE_OBJECT, FILE_PREFIX, ORGANIZATION } from "$/consts/api.ts";

export class FileRepository extends Repository<FileObject> {
  private static instance: FileRepository;

  private constructor() {
    super(FILE_PREFIX, FILE_OBJECT, ORGANIZATION, FILE_KEY);
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
}
