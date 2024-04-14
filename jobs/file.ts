import { FileRepository } from "$/repositories/file.ts";
import { getClient } from "$/providers/retrieval/client.ts";

export class FileJob {
  private static async createFileIndex(org: string, fileId: string) {
    const fileInfo = await FileRepository.getInstance().findInfoById(fileId);
    const client = getClient();
    if (fileInfo) {
      await client.create_file_job(org, fileId, fileInfo.file_path, fileInfo.file_type);
    }
  }

  private static async deleteFile(org: string, fileId: string) {
    const client = getClient();
    await client.delete_file_index(org, fileId);
  }

  public static async execute(args: {
    fileId: string;
    organization: string;
    action: "create" | "delete";
  }) {
    const { action, fileId, organization } = args;
    switch (action) {
      case "create":
        await this.createFileIndex(organization, fileId);
        break;
      case "delete":
        await this.deleteFile(organization, fileId);
        break;
    }
  }
}
