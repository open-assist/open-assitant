import { ulid } from "$std/ulid/mod.ts";
import { kv, Repository, type Sort } from "$/repositories/_repository.ts";
import { ThreadRepository } from "$/repositories/thread.ts";
import { DbCommitError } from "$/utils/errors.ts";
import type { RunStepObjectType } from "openai_schemas";

export class StepRepository extends Repository {
  static idPrefix = "step";
  static object = "thread.run.step";
  static parent = "run";
  static self = "step";
  static hasSecondaryKey = true;

  static genThirdKey(threadId: string, id?: string) {
    if (id) {
      return [ThreadRepository.self, threadId, this.self, id];
    }
    return [ThreadRepository.self, threadId, this.self];
  }

  static async createWithThread(
    fields: Partial<RunStepObjectType>,
    runId: string,
    threadId: string,
    operation?: Deno.AtomicOperation,
  ) {
    const value = {
      object: this.object,
      id: `${this.idPrefix}-${ulid()}`,
      created_at: Date.now(),
      ...fields,
    } as RunStepObjectType;

    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    const key = this.genKvKey(runId, value.id);
    const secondaryKey = this.genKvKey(undefined, value.id);
    const thridKey = this.genThirdKey(threadId, value.id);
    operation
      .check({ key, versionstamp: null })
      .check({ key: secondaryKey, versionstamp: null })
      .check({ key: thridKey, versionstamp: null })
      .set(key, value)
      .set(secondaryKey, key)
      .set(thridKey, key);

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new DbCommitError();

      return { value };
    }

    return { operation, value };
  }

  static async findAllByThreadId(threadId: string, sort?: Sort) {
    const selector = {
      prefix: this.genThirdKey(threadId),
    };
    const options = {
      reverse: sort?.order === "desc",
    };
    const keys = await Array.fromAsync(
      kv.list<Deno.KvKey>(selector, options),
      ({ value }) => value,
    );

    return (await kv.getMany(keys)).map(
      ({ value }) => value as RunStepObjectType,
    );
  }
}
