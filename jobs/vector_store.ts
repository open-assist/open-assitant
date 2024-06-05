import * as log from "$std/log/mod.ts";
import { VectorStoreRepository } from "$/repositories/vector_store.ts";
import { now } from "$/utils/date.ts";
import { kv } from "$/repositories/_repository.ts";

export class VectorStoreJob {
  // private static index(
  //   organization: string,
  //   vectorStoreId: string,
  //   fileId?: string,
  // ) {}

  private static async expire(organization: string, vectorStoreId: string) {
    const logName = `vector store(${organization}/${vectorStoreId})`;
    log.info(`[VectorStoreJob] start expiring ${logName}`);
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
        log.info(`[VectorStoreJob] enqueue next expiring job for ${logName}`);
      } else {
        log.error(
          `[VectorStoreJob] can't enqueue next expiring job for ${logName}`,
        );
      }
    }
  }

  public static async execute(args: {
    organization: string;
    vectorStoreId: string;
    action: "expire";
  }) {
    const { action, vectorStoreId, organization } = args;
    switch (action) {
      case "expire":
        await this.expire(organization, vectorStoreId);
        break;
    }
  }
}
