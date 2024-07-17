import { Pool, QueryArguments } from "$postgres/mod.ts";
import * as log from "$std/log/mod.ts";
import { getEnv } from "$/utils/env.ts";
import { EMBEDDING_DIMENSION, PGVECTOR_URL } from "$/consts/envs.ts";

export default class Client {
  static pool = new Pool(
    getEnv(
      PGVECTOR_URL,
      "postgres://postgres:postgres@localhost:5432/assistant",
    ),
    5,
    true,
  );
  static embeddingDimension = getEnv(EMBEDDING_DIMENSION, "1536");

  public static async create(vectorStoreId: string) {
    const sql = `
        CREATE TABLE IF NOT EXISTS ${vectorStoreId} (
          id BIGSERIAL PRIMARY KEY,
          file_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          content TEXT NOT NULL,
          embedding VECTOR(${this.embeddingDimension})
        )
      `;
    await this.query(sql);
  }

  public static async drop(vectorStoreId: string) {
    await this.query(`DROP TABLE IF EXISTS ${vectorStoreId}`);
  }

  public static async delete(vectorStoreId: string, fileId: string) {
    await this.query(`DELETE FROM ${vectorStoreId} WHERE file_id = $1`, [
      fileId,
    ]);
  }

  public static async insert(
    vectorStoreId: string,
    data: {
      file_id: string;
      file_name: string;
      content: string;
      embedding: number[];
    }[],
  ) {
    const sql =
      `INSERT INTO ${vectorStoreId}(file_id, file_name, content, embedding) VALUES ${
        data.map((d) =>
          `('${d.file_id}','${this.escapeSql(d.file_name)}','${
            this.escapeSql(d.content)
          }','[${d.embedding}]')`
        ).join(", ")
      }`;

    await this.query(sql);
  }

  public static async size(
    vectorStoreId: string,
    fileId?: string,
  ): Promise<number> {
    let query = `SELECT pg_table_size('${vectorStoreId}') as size`;
    if (fileId) {
      query = `WITH record_sizes AS (
    SELECT pg_column_size(t.*) AS column_size FROM ${vectorStoreId} t WHERE file_id = '${fileId}'
)
SELECT 
    sum(column_size) AS size
FROM 
    record_sizes;`;
    }

    const { rows: [{ size }] } = await this.query(query);
    return Number(size);
  }

  private static escapeSql(sql: string) {
    return sql.replace(/(['\\])/g, "$1$1");
  }

  private static async query(query: string, args?: QueryArguments) {
    const connection = await this.pool.connect();
    let result = { rows: [] };
    try {
      result = await connection.queryObject(query, args);
    } catch (e) {
      log.error(`[pgvector] execute query(${query}) with ${e}`);
    } finally {
      connection.release();
    }
    return result;
  }
}
