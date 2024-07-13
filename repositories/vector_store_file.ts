import { kv, Repository } from "$/repositories/base.ts";
import {
  FILE_PREFIX,
  VECTOR_STORE_FILE_KEY,
  VECTOR_STORE_FILE_OBJECT,
  VECTOR_STORE_FILE_PREFIX,
  VECTOR_STORE_OBJECT,
} from "$/consts/api.ts";
import { now } from "$/utils/date.ts";
import { Conflict } from "$/utils/errors.ts";
import {
  AutoChunkingStrategy,
  StaticChunkingStrategy,
  VectorStoreFileObject,
  VectorStoreObject,
} from "$/schemas/openai/mod.ts";
import { Jina } from "$/providers/reader/jina.ts";
import { ulid } from "$std/ulid/mod.ts";

const DEFAULT_CHUNKING_STRATEGY = {
  type: "static",
  static: {
    max_chunk_size_tokens: 800,
    chunk_overlap_tokens: 400,
  },
};

export class VectorStoreFileRepository
  extends Repository<VectorStoreFileObject> {
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
    chunkingStrategy?: AutoChunkingStrategy | StaticChunkingStrategy | null,
    operation?: Deno.AtomicOperation,
  ) {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    let type, url, realFileId = fileId;
    if (Jina.MATCHER.test(fileId)) {
      realFileId = `${FILE_PREFIX}_${ulid()}`;
      type = "url";
      url = fileId;
    }

    const value = {
      id: realFileId,
      object: this.object,
      created_at: now(),
      vector_store_id: vectorStoreId,
      usage_bytes: 0,
      status: "in_progress",
      chunking_strategy: (!chunkingStrategy || chunkingStrategy.type === "auto")
        ? DEFAULT_CHUNKING_STRATEGY
        : chunkingStrategy,
      type,
      url,
    } as VectorStoreFileObject;

    const key = this.genKvKey(vectorStoreId, realFileId);
    operation.check({ key, versionstamp: null }).set(key, value);

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new Conflict();
    }
    return value;
  }

  async createByFileIdWithJob(
    fileId: string,
    vectorStoreId: string,
    organization: string,
    chunkingStrategy?: AutoChunkingStrategy | StaticChunkingStrategy | null,
  ) {
    const operation = kv.atomic();

    const value = await this.createByFileId(
      fileId,
      vectorStoreId,
      chunkingStrategy,
      operation,
    );
    operation.enqueue({
      type: "vector_store_file",
      args: JSON.stringify({
        action: "index",
        vectorStoreId,
        fileId,
        organization,
      }),
    });

    const { ok } = await operation.commit();
    if (!ok) throw new Conflict();
    return value;
  }

  async destoryByObject(
    vs: VectorStoreObject,
    vsf: VectorStoreFileObject,
    organization: string,
  ) {
    const operation = kv.atomic();
    const key = this.genKvKey(vs.id, vsf.id);
    operation.delete(key)
      .enqueue({
        type: "vector_store_file",
        args: JSON.stringify({
          action: "delete",
          vectorStoreId: vs.id,
          fileId: vsf.id,
          organization,
        }),
      });

    await operation.commit();
  }
}
