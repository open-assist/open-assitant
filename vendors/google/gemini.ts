import { env } from "$/fresh.config.ts";
import { type ContentType, type PartType } from "googleai_schemas";
import {
  type AssistantToolsCodeType,
  type AssistantToolsFunctionType,
  type AssistantToolsRetrievalType,
  type MessageObjectType,
  type RunStepObjectType,
} from "openai_schemas";
import { RateLimitExceeded, ServerError } from "$/utils/errors.ts";
import {
  messageObjectToContent,
  runStepDetailsToolCallsToContents,
  generateContentResponseToStepDetails,
} from "$/vendors/google/schemas.ts";

export class Gemini {
  static baseURL = "https://generativelanguage.googleapis.com";
  static apiVersion = "v1beta";

  public static async generateContent(
    modelName: string,
    messages: MessageObjectType[],
    steps?: RunStepObjectType[],
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
    messages.forEach((m) => {
      const content = messageObjectToContent.parse(m);
      if (contents.at(-1)?.role === content.role) {
        contents.at(-1)?.parts.push(...content.parts);
      } else {
        contents.push(content);
      }
    });

    if (steps) {
      steps.forEach((step) => {
        if (step.step_details && step.step_details.type === "tool_calls") {
          contents.push(
            ...runStepDetailsToolCallsToContents.parse(
              step.step_details.tool_calls,
            ),
          );
        }
      });
    }

    if (instructions) {
      (contents[0].parts as PartType[]).unshift({ text: instructions });
    }

    const functions = tools
      ?.filter((t) => t.type === "function")
      .map((t) => ({
        ...(t as AssistantToolsFunctionType).function,
      }));

    const response = await this.fetch(`/models/${modelName}:generateContent`, {
      method: "post",
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
