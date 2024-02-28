import { env } from "$/fresh.config.ts";
import { type ContentType } from "googleai_schemas";
import {
  type AssistantToolsCodeType,
  type AssistantToolsFunctionType,
  type AssistantToolsRetrievalType,
  type MessageObjectType,
  type RunStepObjectType,
} from "openai_schemas";
import { RateLimitExceeded, ServerError } from "$/utils/errors.ts";
import {
  generateContentResponseToStepDetails,
  messageObjectToContent,
  runStepDetailsToolCallsToContents,
} from "$/vendors/google/schemas.ts";

export class Gemini {
  static baseURL = "https://generativelanguage.googleapis.com";
  static apiVersion = "v1beta";

  private static convertMessageToContent(
    contents: ContentType[],
    message: MessageObjectType,
  ) {
    const content = messageObjectToContent.parse(message);
    if (contents.at(-1)?.role === content.role) {
      contents.at(-1)?.parts.push(...content.parts);
    } else {
      contents.push(content);
    }
  }

  private static convertStepToContent(
    contents: ContentType[],
    step: RunStepObjectType,
  ) {
    contents.push(
      ...runStepDetailsToolCallsToContents.parse(step.step_details),
    );
  }

  private static transformMessagesAndSteps(
    contents: ContentType[],
    messages: MessageObjectType[],
    steps: RunStepObjectType[],
  ) {
    const toolCallSteps = steps.filter(
      (s) => s.step_details && s.step_details.type === "tool_calls",
    );
    let mIdx = 0,
      sIdx = 0;
    while (mIdx < messages.length && sIdx < toolCallSteps.length) {
      const mTime = messages.at(mIdx)?.created_at as number;
      const sTime = toolCallSteps.at(sIdx)?.created_at as number;
      if (mTime <= sTime) {
        this.convertMessageToContent(
          contents,
          messages.at(mIdx) as MessageObjectType,
        );
        mIdx += 1;
      } else {
        this.convertStepToContent(
          contents,
          toolCallSteps.at(sIdx) as RunStepObjectType,
        );
        sIdx += 1;
      }
    }
    while (mIdx < messages.length) {
      this.convertMessageToContent(
        contents,
        messages.at(mIdx) as MessageObjectType,
      );
      mIdx += 1;
    }
    while (sIdx < toolCallSteps.length) {
      this.convertStepToContent(
        contents,
        toolCallSteps.at(sIdx) as RunStepObjectType,
      );
    }
  }

  public static async generateContent(
    modelName: string,
    messages: MessageObjectType[],
    steps: RunStepObjectType[],
    instructions?: string | null,
    tools?:
      | (
          | AssistantToolsCodeType
          | AssistantToolsFunctionType
          | AssistantToolsRetrievalType
        )[]
      | null,
  ) {
    const contents: ContentType[] = [];
    if (instructions) {
      contents.push({
        role: "user",
        parts: [{ text: instructions }],
      });
    }

    this.transformMessagesAndSteps(contents, messages, steps);

    const functions = tools
      ?.filter((t) => t.type === "function")
      .map((t) => ({
        ...(t as AssistantToolsFunctionType).function,
      }));

    const response = await this.fetch(`/models/${modelName}:generateContent`, {
      method: "POST",
      body: JSON.stringify({
        contents,
        tools: [
          {
            function_declarations: functions,
          },
        ],
      }),
    });
    if (response.status === 429) throw new RateLimitExceeded();
    if (response.status === 400 || response.status >= 500) {
      if (response.status === 400) {
        console.error("[Gemini - GoogleAI]", await response.json());
      }
      throw new ServerError();
    }
    return generateContentResponseToStepDetails.parse(await response.json());
  }

  private static fetch(input: string, init?: RequestInit) {
    return fetch(`${this.baseURL}/${this.apiVersion}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "X-Goog-Api-Key": env["GOOGLE_API_KEY"],
      },
    });
  }
}
