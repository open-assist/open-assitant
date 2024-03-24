import { NotImplemented } from "$/utils/errors.ts";
import {
  CreateChatCompletionRequestType,
  CreateChatCompletionResponseType,
} from "openai_schemas";

export class Base {
  protected static _fetch(
    _input: string,
    _init?: RequestInit,
  ): Promise<Response> {
    throw new NotImplemented();
  }

  static createChatCompletion(
    _request: CreateChatCompletionRequestType,
    _mappedModel?: string,
  ): Promise<CreateChatCompletionResponseType | ReadableStream> {
    throw new NotImplemented();
  }
}
