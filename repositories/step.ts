import { StepObject } from "@open-schemas/zod/openai";
import { RUN_KEY, STEP_KEY, STEP_OBJECT, STEP_PREFIX, THREAD_KEY } from "$/consts/api.ts";
import { kv, Repository, type Sort } from "$/repositories/base.ts";
import { Conflict } from "$/utils/errors.ts";
import { JobMessage } from "$/jobs/job.ts";

export class StepRepository extends Repository<StepObject> {
  private static instance: StepRepository;

  private constructor() {
    super(STEP_PREFIX, STEP_OBJECT, RUN_KEY, STEP_KEY, true);
  }

  public static getInstance(): StepRepository {
    if (!StepRepository.instance) {
      StepRepository.instance = new StepRepository();
    }
    return StepRepository.instance;
  }

  genThirdKey(threadId: string, id?: string) {
    if (id) {
      return [THREAD_KEY, threadId, this.self, id];
    }
    return [THREAD_KEY, threadId, this.self];
  }

  async createWithThread(
    fields: Partial<StepObject>,
    runId: string,
    threadId: string,
    operation?: Deno.AtomicOperation,
  ): Promise<StepObject> {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    const value = await this.create(fields, runId, operation);

    const key = this.genKvKey(runId, value.id);
    const thridKey = this.genThirdKey(threadId, value.id);
    operation
      .check({ key: thridKey, versionstamp: null })
      .set(thridKey, key)
      .enqueue({ type: "step", args: JSON.stringify({ stepId: value.id }) } as JobMessage);

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new Conflict();
    }

    return value;
  }

  async findAllByThreadId(threadId: string, sort?: Sort) {
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
    // TODO: TypeError: too many ranges (max 10)
    return (await kv.getMany<StepObject[]>(keys)).map(({ value }) => value);
  }
}
