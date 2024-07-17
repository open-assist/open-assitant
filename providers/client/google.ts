import {
  GOOGLE_API_KEY,
  GOOGLE_API_URL,
  GOOGLE_API_VERSION,
} from "$/consts/envs.ts";
import { getEnv } from "$/utils/env.ts";
import { logResponseError } from "$/utils/log.ts";

export default class Client {
  static apiVersion = getEnv(GOOGLE_API_VERSION, "v1");
  static baseURL = getEnv(
    GOOGLE_API_URL,
    "https://generativelanguage.googleapis.com",
  );
  static apiKey = getEnv(GOOGLE_API_KEY);

  static async fetch(input: string, init?: RequestInit) {
    return await fetch(`${this.baseURL}/${this.apiVersion}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "X-Goog-Api-Key": this.apiKey,
      },
    }).then(logResponseError);
  }
}
