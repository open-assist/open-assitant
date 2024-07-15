import { kv } from "$/repositories/base.ts";
import { VectorStoreRepository } from "$/repositories/vector_store.ts";
import { VectorStoreFileRepository } from "$/repositories/vector_store_file.ts";
import { NotFound } from "$/utils/errors.ts";
import * as log from "$std/log/mod.ts";
import { Jina } from "$/providers/reader/jina.ts";
import { getClient } from "$/providers/embedding/client.ts";
import {
  StaticChunkingStrategy,
  VectorStoreFileObject,
} from "$/schemas/openai/mod.ts";
import Tokeniser from "$/providers/tokeniser/open_tokeniser.ts";
import { VectorStoreRecord } from "$/types/open_assistant/mod.ts";
import VectorDb from "$/providers/vector_db/pgvector.ts";

const LOG_TAG = "[VectorStoreFileJob]";

export class VectorStoreFileJob {
  private static async getFileContent(
    vsf: VectorStoreFileObject,
  ): Promise<{ fileName: string; content: string }> {
    if (vsf.type === "url") {
      const { title, content } = await Jina.read(vsf.url as string);
      return {
        fileName: title,
        content,
      };
    }
    return {
      fileName: "",
      content: "",
    };
  }

  private static async chunkFileContent(
    content: string,
    strategy: StaticChunkingStrategy,
  ) {
    const { static: staticStrategy } = strategy;
    return await Tokeniser.createChunks(
      content,
      staticStrategy.max_chunk_size_tokens,
      staticStrategy.chunk_overlap_tokens,
    );
  }

  private static async embedContent(
    chunks: string[],
    fileId: string,
    fileName: string,
  ) {
    const embeddingClient = await getClient();
    const embeddingsData = chunks.map(async (content: string) => {
      const { data: [embedding] } = await embeddingClient.createEmbedding({
        input: content,
        model: "models/text-embedding-004",
      });

      return {
        file_id: fileId,
        file_name: fileName,
        content,
        embedding: embedding.embedding,
      } as VectorStoreRecord;
    });
    return await Promise.all(embeddingsData);
  }

  private static async index(
    organization: string,
    vectorStoreId: string,
    fileId: string,
  ) {
    const logName = `vector store(${vectorStoreId}) and file(${fileId})`;
    log.info(`${LOG_TAG} start {index} action for ${logName}`);

    const vsfRepo = VectorStoreFileRepository.getInstance();
    const vsRepo = VectorStoreRepository.getInstance();
    let vsf, vs;
    try {
      vsf = await vsfRepo.findById(fileId, vectorStoreId);
      vs = await vsRepo.findById(vectorStoreId, organization);
    } catch (e) {
      log.error(`${LOG_TAG} find ${logName} with ${e}`);
    }
    if (!vsf || !vs) return;

    const { fileName, content } = await this.getFileContent(vsf);
    const chunks = await this.chunkFileContent(
      content,
      vsf.chunking_strategy as StaticChunkingStrategy,
    );
    const records = await this.embedContent(
      chunks.map((c) => c.content),
      fileId,
      fileName,
    );
    await VectorDb.insert(vectorStoreId, records);

    try {
      const operation = kv.atomic();
      vsfRepo.update(
        vsf,
        {
          status: "completed",
          usage_bytes: await VectorDb.size(vectorStoreId, fileId),
        },
        vectorStoreId,
        operation,
      );
      vsRepo.update(
        vs,
        {
          file_counts: {
            ...vs.file_counts,
            in_progress: this.accumulate(-1, vs.file_counts.in_progress),
            completed: this.accumulate(1, vs.file_counts.completed),
          },
          usage_bytes: await VectorDb.size(vectorStoreId),
        },
        organization,
        operation,
      );
      await operation.commit();
      log.info(`${LOG_TAG} completed {index} action for ${logName}`);
    } catch (e) {
      switch (e.constructor) {
        case NotFound:
          log.error(`${LOG_TAG} ${logName} were not found`);
          return;
      }
    }
  }

  private static async delete(
    organization: string,
    vectorStoreId: string,
    fileId: string,
    status: VectorStoreFileObject["status"],
  ) {
    const logName = `vector store(${vectorStoreId}) and file(${fileId})`;
    log.info(`${LOG_TAG} start {delete} action for ${logName}`);
    const vsRepo = VectorStoreRepository.getInstance();
    let vs;
    try {
      vs = await vsRepo.findById(vectorStoreId, organization);
    } catch (e) {
      log.error(`${LOG_TAG} find ${logName} with ${e}`);
    }
    if (!vs) return;

    await VectorDb.delete(vectorStoreId, fileId);

    await vsRepo.update(
      vs,
      {
        usage_bytes: await VectorDb.size(vectorStoreId),
        file_counts: {
          ...vs.file_counts,
          [status]: this.accumulate(-1, vs.file_counts[status]),
          total: this.accumulate(-1, vs.file_counts.total),
        },
      },
      organization,
    );

    log.info(`${LOG_TAG} complete {delete} action for ${logName}`);
  }

  private static accumulate(b: number, a?: number | null) {
    if (a) {
      return a + b > 0 ? a + b : 0;
    } else {
      if (b > 0) {
        return b;
      }
      return 0;
    }
  }

  public static async execute(args: {
    organization: string;
    vectorStoreId: string;
    fileId: string;
    action: "index" | "delete";
    status?: string;
  }) {
    const { action, vectorStoreId, organization, fileId } = args;
    switch (action) {
      case "index":
        await this.index(organization, vectorStoreId, fileId);
        break;
      case "delete":
        await this.delete(
          organization,
          vectorStoreId,
          fileId,
          args["status"] as VectorStoreFileObject["status"],
        );
        break;
    }
  }
}
