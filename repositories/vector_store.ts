import { kv, Repository } from "$/repositories/base.ts";
import {
  CreateVectorStoreRequest,
  VectorStoreObject,
} from "$open-schemas/types/openai/mod.ts";
import {
  ORGANIZATION,
  VECTOR_STORE_KEY,
  VECTOR_STORE_OBJECT,
  VECTOR_STORE_PREFIX,
} from "$/consts/api.ts";
import { ulid } from "$std/ulid/mod.ts";
import { now } from "$/utils/date.ts";
import { Conflict } from "$/utils/errors.ts";
import { VectorStoreFileRepository } from "$/repositories/vector_store_file.ts";

export class VectorStoreRepository extends Repository<VectorStoreObject> {
  private static instance: VectorStoreRepository;
  private constructor() {
    super(
      VECTOR_STORE_PREFIX,
      VECTOR_STORE_OBJECT,
      ORGANIZATION,
      VECTOR_STORE_KEY,
    );
  }

  public static getInstance(): VectorStoreRepository {
    if (!VectorStoreRepository.instance) {
      VectorStoreRepository.instance = new VectorStoreRepository();
    }
    return VectorStoreRepository.instance;
  }

  async createWithFiles(
    fields: CreateVectorStoreRequest,
    org: string,
    operation?: Deno.AtomicOperation,
  ) {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    let status: VectorStoreObject["status"] = "completed";
    let totalFilesCount = 0;
    if (fields.file_ids) {
      status = "in_progress";
      totalFilesCount = fields.file_ids.length;
    }

    const id = `${this.idPrefix}-${ulid()}`;
    const key = this.genKvKey(org, id);
    const currentTime = now();
    const value = {
      id,
      object: this.object,
      created_at: currentTime,
      last_active_at: currentTime,
      status,
      usage_bytes: 0,
      file_counts: {
        in_progress: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        total: totalFilesCount,
      },
      name: fields.name,
      expires_after: fields.expires_after,
      metadata: fields.metadata,
    } as VectorStoreObject;

    operation.check({ key, versionstamp: null }).set(key, value);

    if (fields.file_ids) {
      fields.file_ids.forEach(async (fileId) => {
        await VectorStoreFileRepository.getInstance().createByFileId(
          fileId,
          id,
          operation,
        );
      });
    }

    if (fields.expires_after) {
      operation.enqueue({
        type: "vector_store",
        args: JSON.stringify({
          action: "expire",
          organization: org,
          vectorStoreId: id,
        }),
      }, {
        delay: fields.expires_after.days * 24 * 3600 * 1000,
      });
    }

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new Conflict();
    }
    return value;
  }
}
