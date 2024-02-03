import { kv, Repository } from "$/repositories/_repository.ts";
import type { Meta } from "$/schemas/_base.ts";
import type { Token } from "$/schemas/token.ts";
import { DbCommitError } from "$/utils/errors.ts";

export class TokenRepository extends Repository {
  static idPrefix = "tkn";
  static object = "token";
  static parent = "organization";
  static self = "token";
  static tokenByContent = "token_by_content";

  static maskToken(token: string) {
    return `${token.slice(0, 8)}***${token.slice(-4)}`;
  }

  private static genTokenByContentKey(org: string, token: string) {
    return [
      this.parent,
      org,
      this.tokenByContent,
      token,
    ];
  }
  private static genOrgByTokenKey(token: string) {
    return [
      this.tokenByContent,
      token,
      this.parent,
    ];
  }

  static async create<T extends Meta>(
    fields: Partial<T>,
    organization: string,
  ) {
    const token = `sk-${crypto.randomUUID()}`;
    const { operation, value } = this.createWithoutCommit<T>({
      ...fields,
      content: token,
    }, organization);

    operation.set(
      this.genTokenByContentKey(organization, token),
      this.genKvKey(organization, value.id),
    ).set(
      this.genOrgByTokenKey(token),
      organization,
    );

    const { ok } = await operation.commit();
    if (!ok) throw new DbCommitError();

    return value;
  }

  static async destory(
    id: string,
    organization: string,
  ): Promise<void> {
    const token = await this.findById<Token>(id, organization);
    const { ok } = await kv.atomic()
      .delete(this.genKvKey(organization, id))
      .delete(this.genTokenByContentKey(organization, token.content))
      .delete(this.genOrgByTokenKey(token.content))
      .commit();
    if (!ok) throw new DbCommitError();
  }

  static async findOrgByToken(token: string) {
    return await kv.get<string>(this.genOrgByTokenKey(token));
  }
}
