import * as log from "$std/log/mod.ts";
import { VectorStoreRepository } from "$/repositories/vector_store.ts";
import { now } from "$/utils/date.ts";
import { kv } from "$/repositories/_repository.ts";
import Client from "$/providers/vector_db/pgvector.ts";
import { VectorStoreFileRepository } from "$/repositories/vector_store_file.ts";

const LOG_TAG = "[VectorStoreJob]";

export class VectorStoreJob {
  private static async create(organization: string, vectorStoreId: string) {
    const logName = `vector store(${vectorStoreId})`;
    log.info(`${LOG_TAG} start {create} action for ${logName}`);

    const vsRepo = VectorStoreRepository.getInstance();
    const vsfRepo = VectorStoreFileRepository.getInstance();

    const vs = await vsRepo.findById(vectorStoreId, organization);
    const files = await vsfRepo.findAll(
      vectorStoreId,
    );
    if (!vs || !files) {
      log.warn(`${LOG_TAG} can not find ${logName} or files.`);
      return;
    }

    await Client.create(vectorStoreId);

    const operation = kv.atomic();
    files.forEach((f) => {
      operation.enqueue({
        type: "vector_store_file",
        args: JSON.stringify({
          action: "index",
          organization,
          vectorStoreId,
          fileId: f.id,
        }),
      });
    });
    vsRepo.update(
      vs,
      {
        file_counts: {
          ...vs.file_counts,
          in_progress: vs.file_counts.in_progress + files.length,
        },
      },
      organization,
      operation,
    );
    await operation.commit();
    log.info(`${LOG_TAG} completed {create} action for ${logName}`);
  }

  private static async delete(vectorStoreId: string) {
    const logName = `vector store(${vectorStoreId})`;
    log.info(`${LOG_TAG} start {delete} action for ${logName}`);
    await Client.drop(vectorStoreId);
    log.info(`${LOG_TAG} completed {delete} action for ${logName}`);
  }

  private static async expire(organization: string, vectorStoreId: string) {
    const logName = `vector store(${organization}/${vectorStoreId})`;
    log.info(`${LOG_TAG} start expiring ${logName}`);
    const repository = VectorStoreRepository.getInstance();
    const vectorStore = await repository.findById(vectorStoreId, organization);
    if (vectorStore.status === "expired") {
      return;
    }

    const currentTime = now();
    const lastActiveAt = vectorStore.last_active_at as number;
    const duration = vectorStore.expires_after
      ? vectorStore.expires_after.days * 24 * 3600
      : 0;
    if (currentTime - lastActiveAt >= duration) {
      await repository.update(vectorStore, {
        status: "expired",
        expires_at: now(),
      });
      log.info(`[VectorStoreJob] expired ${logName}`);
    } else {
      const delay = (lastActiveAt + duration - currentTime) * 1000;
      const { ok } = await kv.atomic()
        .enqueue({
          type: "vector_store",
          args: JSON.stringify({
            action: "expire",
            organization,
            vectorStoreId,
          }),
        }, {
          delay,
        })
        .commit();

      if (ok) {
        log.info(`${LOG_TAG} enqueue next expiring job for ${logName}`);
      } else {
        log.error(
          `${LOG_TAG} can't enqueue next expiring job for ${logName}`,
        );
      }
    }
  }

  public static async execute(args: {
    organization: string;
    vectorStoreId: string;
    action: "create" | "delete" | "expire";
  }) {
    const { action, vectorStoreId, organization } = args;
    switch (action) {
      case "create":
        await this.create(organization, vectorStoreId);
        break;
      case "delete":
        await this.delete(vectorStoreId);
        break;
      case "expire":
        await this.expire(organization, vectorStoreId);
        break;
    }
  }
}
