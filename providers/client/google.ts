import { GOOGLE_API_KEY, GOOGLE_API_URL } from "$/utils/constants.ts";

export default class Client {
  static apiVersion = "v1";
  static baseURL = Deno.env.get(GOOGLE_API_URL) ??
    "https://generativelanguage.googleapis.com";

  static fetch(input: string, init?: RequestInit) {
    return fetch(`${this.baseURL}/${this.apiVersion}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "X-Goog-Api-Key": Deno.env.get(GOOGLE_API_KEY) as string,
      },
    }).then((r) => {
      return r.json();
    });
  }
}
