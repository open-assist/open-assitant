import { Base } from "$/providers/retrieval/base.ts";
import { OPEN_RETRIEVAL_API_KEY, OPEN_RETRIEVAL_API_URL } from "$/consts/envs.ts";
import { APPLICATION_JSON_HEADER } from "$/consts/api.ts";
import { X_RETRIEVAL_TOKEN, X_RETRIEVAL_ORGANIZATION } from "$/consts/retrieval.ts";
import { getEnv } from "$/utils/env.ts";
import { logResponseError } from "$/utils/log.ts";

export class OpenRetrieval extends Base {
  protected static async _fetch(input: string, init?: RequestInit) {
    const apiKey = getEnv(OPEN_RETRIEVAL_API_KEY);
    const url = getEnv(OPEN_RETRIEVAL_API_URL);
    return fetch(`${url}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        ...APPLICATION_JSON_HEADER,
        [X_RETRIEVAL_TOKEN]: apiKey,
      },
    }).then(logResponseError);
  }

  static async open(filePath: string): Promise<string> {
    const response = await this._fetch(`/files/${filePath}/documents`, {
      headers: {
        [X_RETRIEVAL_ORGANIZATION]: "#org",
      },
    });
    return response.text();
  }

  static async search(query: string, filePaths: string[]): Promise<string> {
    const response = await this._fetch(`/files/search`, {
      method: "POST",
      body: JSON.stringify({
        query,
        file_names: filePaths,
      }),
      headers: {
        [X_RETRIEVAL_ORGANIZATION]: "#org",
      },
    });
    return response.text();
  }

  static async create_file_job(org: string, id: string, name: string, type: string): Promise<void> {
    await this._fetch(`/files/${id}/job`, {
      method: "POST",
      body: JSON.stringify({
        file_name: name,
        file_type: type,
      }),
      headers: {
        [X_RETRIEVAL_ORGANIZATION]: org,
      },
    });
  }

  static async delete_file_index(org: string, id: string): Promise<void> {
    await this._fetch(`/files/${id}/index`, {
      method: "DELETE",
      headers: {
        [X_RETRIEVAL_ORGANIZATION]: org,
      },
    });
  }
}
