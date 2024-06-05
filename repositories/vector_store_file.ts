import { kv, Repository } from "$/repositories/base.ts";
import { VectorStoreFile } from "$open-schemas/types/openai/assistants.ts";
import {
  VECTOR_STORE_FILE_KEY,
  VECTOR_STORE_FILE_OBJECT,
  VECTOR_STORE_FILE_PREFIX,
  VECTOR_STORE_OBJECT,
} from "$/consts/api.ts";
import { now } from "$/utils/date.ts";
import { Conflict } from "$/utils/errors.ts";

export class VectorStoreFileRepository extends Repository<VectorStoreFile> {
  private static instance: VectorStoreFileRepository;
  private constructor() {
    super(
      VECTOR_STORE_FILE_PREFIX,
      VECTOR_STORE_FILE_OBJECT,
      VECTOR_STORE_OBJECT,
      VECTOR_STORE_FILE_KEY,
    );
  }

  public static getInstance(): VectorStoreFileRepository {
    if (!VectorStoreFileRepository.instance) {
      VectorStoreFileRepository.instance = new VectorStoreFileRepository();
    }
    return VectorStoreFileRepository.instance;
  }

  async createByFileId(
    fileId: string,
    vectorStoreId: string,
    operation?: Deno.AtomicOperation,
  ) {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    const value = {
      id: fileId,
      object: this.object,
      created_at: now(),
      vector_store_id: vectorStoreId,
      usage_bytes: 0,
      status: "in_progress",
    } as VectorStoreFile;

    const key = this.genKvKey(vectorStoreId, fileId);
    operation.check({ key, versionstamp: null }).set(key, value).enqueue({
      type: "vector_store_file",
      args: JSON.stringify({
        action: "index",
        vectorStoreId,
        fileId,
      }),
    });

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new Conflict();
    }
    return value;
  }
}
