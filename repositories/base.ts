import { ObjectMeta, Pagination, Ordering } from "@open-schemas/zod/openai";
import { z } from "zod";
import { ulid } from "$std/ulid/mod.ts";
import { Conflict, NotFound } from "$/utils/errors.ts";
import { now } from "$/utils/date.ts";
import { DENO_KV_PATH } from "$/consts/envs.ts";

let path = undefined;
if ((await Deno.permissions.query({ name: "env", variable: DENO_KV_PATH })).state === "granted") {
  path = Deno.env.get(DENO_KV_PATH);
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

export class Repository<T> {
  idPrefix: string;
  object: string;
  parent: string;
  self: string;
  hasSecondaryKey: boolean;

  constructor(
    idPrefix: string,
    object: string,
    parent: string,
    self: string,
    hasSecondaryKey: boolean = false,
  ) {
    this.idPrefix = idPrefix;
    this.object = object;
    this.parent = parent;
    this.self = self;
    this.hasSecondaryKey = hasSecondaryKey;
  }

  genKvKey(parentId?: string, id?: string): Deno.KvKey {
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

  async findAll(parentId?: string, ordering?: Ordering): Promise<T[]> {
    const selector = {
      prefix: this.genKvKey(parentId),
    };
    const options = {
      reverse: ordering?.order === "desc",
    };
    return await Array.fromAsync(kv.list<T>(selector, options), ({ value }) => value);
  }

  async findAllByPage(
    parentId?: string,
    pagination?: Pagination,
    ordering?: Ordering,
  ): Promise<Page<T>> {
    const selector = {
      prefix: this.genKvKey(parentId),
      start: pagination?.after && this.genKvKey(parentId, pagination.after),
      end: pagination?.before && this.genKvKey(parentId, pagination.before),
    } as Deno.KvListSelector;
    const options = {
      limit: pagination?.limit && pagination.limit + 1,
      reverse: ordering?.order === "desc",
    } as Deno.KvListOptions;

    const objects = await Array.fromAsync(
      kv.list<ObjectMeta>(selector, options),
      ({ value }) => value,
    );
    const page = {
      object: "list",
      data: [] as T[],
      first_id: objects.at(0)?.id,
      last_id: undefined,
      has_more: false,
    } as Page<T>;
    if (pagination?.limit && objects.length > pagination.limit) {
      page.has_more = true;
      page.data = objects.slice(0, -1) as T[];
      page.last_id = objects.at(-2)?.id;
    } else {
      page.data = objects as T[];
      page.last_id = objects.at(-1)?.id;
    }
    return page;
  }

  async findOne(parentId?: string): Promise<T | undefined> {
    const selector = {
      prefix: this.genKvKey(parentId),
    } as Deno.KvListSelector;
    const options = {
      limit: 1,
      reverse: true,
    } as Deno.KvListOptions;

    const entrys = await Array.fromAsync(kv.list<T>(selector, options), ({ value }) => value);
    return entrys.at(0);
  }

  async findById(id: string, parentId?: string): Promise<T> {
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

  async create(
    fields: Partial<T>,
    parentId?: string,
    operation?: Deno.AtomicOperation,
  ): Promise<T> {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    const id = `${this.idPrefix}-${ulid()}`;
    const value = {
      id,
      object: this.object,
      created_at: now(),
      ...fields,
    } as T;

    const key = this.genKvKey(parentId, id);
    operation.check({ key, versionstamp: null }).set(key, value);

    if (this.hasSecondaryKey) {
      const secondaryKey = this.genKvKey(undefined, id);
      operation.check({ key: secondaryKey, versionstamp: null }).set(secondaryKey, key);
    }

    if (commit) {
      const { ok } = await operation.commit();
      if (!ok) throw new Conflict();
    }
    return value;
  }

  async update(
    old: T,
    fields: Partial<T>,
    parentId?: string,
    operation?: Deno.AtomicOperation,
  ): Promise<T> {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }
    const { id } = old as ObjectMeta;
    const key = this.genKvKey(parentId, id);
    const value = {
      ...old,
      ...fields,
    } as T;
    operation.set(key, value);

    if (commit) {
      await operation.commit();
    }

    return value;
  }

  async destory(id: string, parentId?: string, operation?: Deno.AtomicOperation) {
    let commit = true;
    if (operation) {
      commit = false;
    } else {
      operation = kv.atomic();
    }

    const key = this.genKvKey(parentId, id);
    operation.delete(key);

    if (this.hasSecondaryKey) {
      const secondaryKey = this.genKvKey(undefined, id);
      operation.delete(secondaryKey);
    }

    if (commit) {
      await operation.commit();
    }
  }
}
