import { z } from "zod";
import { ulid } from "$std/ulid/mod.ts";
import { DbCommitError, NotFound } from "$/utils/errors.ts";
import { type Meta } from "$/schemas/_base.ts";

const DENO_KV_PATH_KEY = "DENO_KV_PATH";
let path = undefined;
if (
  (await Deno.permissions.query({ name: "env", variable: DENO_KV_PATH_KEY }))
    .state === "granted"
) {
  path = Deno.env.get(DENO_KV_PATH_KEY);
}
export const kv = await Deno.openKv(path);

export const pagableSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  after: z.string().optional(),
  before: z.string().optional(),
});
export type Pagable = z.infer<typeof pagableSchema>;

export const sortSchema = z.object({
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type Sort = z.infer<typeof sortSchema>;

export interface Page<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  first_id?: string;
  last_id?: string;
}

export class Repository {
  static idPrefix: string;
  static object: string;
  static parent: string;
  static self: string;
  static hasSecondaryKey = false;

  static genKvKey(parentId?: string, id?: string): Deno.KvKey {
    if (parentId) {
      if (id) {
        return [this.parent, parentId, this.self, id];
      } else {
        return [this.parent, parentId, this.self];
      }
    } else {
      if (id) {
        return [this.self, id];
      } else {
        return [this.self];
      }
    }
  }

  static async findAll<T extends Meta>(parentId?: string, sort?: Sort) {
    const selector = {
      prefix: this.genKvKey(parentId),
    };
    const options = {
      reverse: sort?.order === "desc",
    };
    return await Array.fromAsync(
      kv.list<T>(selector, options),
      ({ value }) => value,
    );
  }

  static async findAllByPage<T>(
    parentId?: string,
    pagable?: Pagable,
    sort?: Sort,
  ): Promise<Page<T>> {
    const selector = {
      prefix: this.genKvKey(parentId),
      start: pagable?.after && this.genKvKey(parentId, pagable.after),
      end: pagable?.before && this.genKvKey(parentId, pagable.before),
    } as Deno.KvListSelector;
    const options = {
      limit: pagable?.limit && pagable.limit + 1,
      reverse: sort?.order === "desc",
    } as Deno.KvListOptions;

    const objects = await Array.fromAsync(
      kv.list<Meta>(selector, options),
      ({ value }) => value,
    );
    const page = {
      object: "list",
      data: [] as T[],
      first_id: objects.at(0)?.id,
      last_id: undefined,
      has_more: false,
    } as Page<T>;
    if (pagable?.limit && objects.length > pagable.limit) {
      page.has_more = true;
      page.data = objects.slice(0, -1) as T[];
      page.last_id = objects.at(-2)?.id;
    } else {
      page.data = objects as T[];
      page.last_id = objects.at(-1)?.id;
    }
    return page;
  }

  static async findOne<T>(parentId?: string) {
    const selector = {
      prefix: this.genKvKey(parentId),
    } as Deno.KvListSelector;
    const options = {
      limit: 1,
      reverse: true,
    } as Deno.KvListOptions;

    const entrys = await Array.fromAsync(
      kv.list<T>(selector, options),
      ({ value }) => value,
    );
    return entrys.at(0);
  }

  static async findById<T>(id: string, parentId?: string) {
    let key;
    if (this.hasSecondaryKey && !parentId) {
      const secondaryKey = this.genKvKey(undefined, id);
      key = (await kv.get<Deno.KvKey>(secondaryKey)).value as Deno.KvKey;
    } else {
      key = this.genKvKey(parentId, id);
    }

    const entry = await kv.get<T>(key);
    if (!entry.value) {
      throw new NotFound({ instance: `/${this.self}s/${id}` });
    }
    return entry.value;
  }

  static createWithoutCommit<T extends Meta>(
    fields: Partial<T>,
    parentId?: string,
  ) {
    const value = {
      object: this.object,
      id: `${this.idPrefix}-${ulid()}`,
      created_at: Date.now(),
      ...fields,
    } as T;

    const key = this.genKvKey(parentId, value.id);
    const operation = kv
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, value);

    if (this.hasSecondaryKey) {
      const secondaryKey = this.genKvKey(undefined, value.id);
      operation
        .check({ key: secondaryKey, versionstamp: null })
        .set(secondaryKey, key);
    }

    return { operation, value };
  }

  static async create<T extends Meta>(fields: Partial<T>, parentId?: string) {
    const { operation, value } = this.createWithoutCommit(fields, parentId);

    const { ok } = await operation.commit();
    if (!ok) throw new DbCommitError();

    return value;
  }

  static updateWithoutCommit<T extends Meta>(
    old: T,
    fields: Partial<T>,
    parentId?: string,
    operation?: Deno.AtomicOperation,
  ) {
    const key = this.genKvKey(parentId, old.id);
    const value = {
      ...old,
      ...fields,
    } as T;

    if (!operation) {
      operation = kv.atomic();
    }
    operation.set(key, value);

    return { operation, value };
  }

  static async update<T extends Meta>(
    old: T,
    fields: Partial<T>,
    parentId?: string,
  ) {
    const { operation, value } = this.updateWithoutCommit(
      old,
      fields,
      parentId,
    );

    const { ok } = await operation.commit();
    if (!ok) throw new DbCommitError();

    return value;
  }

  static async destory(id: string, parentId?: string) {
    const key = this.genKvKey(parentId, id);
    const operation = kv.atomic().delete(key);

    if (this.hasSecondaryKey) {
      const secondaryKey = this.genKvKey(undefined, id);
      operation.delete(secondaryKey);
    }
    const { ok } = await operation.commit();
    if (!ok) throw new DbCommitError();
  }
}
