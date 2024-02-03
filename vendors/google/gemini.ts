import { ulid } from "$std/ulid/mod.ts";
import { env } from "$/fresh.config.ts";
import {
  type ContentType,
  GenerateContentResponse,
  type PartType,
} from "googleai_schemas";
import {
  type AssistantToolsCodeType,
  type AssistantToolsFunctionType,
  type AssistantToolsRetrievalType,
  MessageContentTextObject,
  MessageObject,
  type MessageObjectType,
  RunStepDetailsToolCallsObject,
  type RunStepDetailsToolCallsObjectType,
  type RunStepObjectType,
} from "openai_schemas";
import { z } from "zod";
import { RateLimitExceeded, ServerError } from "$/utils/errors.ts";

function isFunctionCallParts(parts: object[]) {
  for (const p of parts) {
    if ("functionCall" in p) {
      return true;
    }
  }
  return false;
}

const messageObjectToContent = MessageObject.transform((message) => ({
  role: message.role === "assistant" ? "model" : "user",
  parts: message.content.map((c) => {
    if (c.type === "text") {
      return { text: c.text.value };
    }
    return {};
  }),
} as ContentType));

const runStepDetailsToolCallsToContents = RunStepDetailsToolCallsObject
  .transform((toolCalls) => {
    return [
      {
        role: "model",
        parts: toolCalls.tool_calls.map((c) => {
          if (c.type === "function") {
            return {
              functionCall: {
                name: c.function.name,
                args: JSON.parse(c.function.arguments),
              },
            };
          }
          return {};
        }),
      },
      {
        role: "function",
        parts: toolCalls.tool_calls.map((c) => {
          if (c.type === "function") {
            return {
              functionResponse: {
                name: c.function.name,
                response: c.function.output && JSON.parse(c.function.output),
              },
            };
          }
          return {};
        }),
      },
    ];
  });

const RunStepDetailsMessagesObject = z.object({
  type: z.enum(["messages"]),
  messages: z.array(MessageContentTextObject),
});
export type RunStepDetailsMessagesObjectType = z.infer<
  typeof RunStepDetailsMessagesObject
>;

const generateContentResponseToStepDetails = GenerateContentResponse.transform(
  (v) =>
    v.candidates.map((c) => {
      if (c.content.parts) {
        if (isFunctionCallParts(c.content.parts)) {
          return {
            type: "tool_calls",
            tool_calls: c.content.parts.map((p) => {
              const functionCall = p.functionCall;
              return {
                id: `call-${ulid()}`,
                type: "function",
                "function": {
                  name: functionCall?.name,
                  arguments: JSON.stringify(functionCall?.args),
                },
              };
            }),
          } as RunStepDetailsToolCallsObjectType;
        } else {
          return {
            type: "messages",
            messages: c.content.parts.map((p) => {
              return {
                type: "text",
                text: {
                  value: p.text,
                },
              };
            }),
          } as RunStepDetailsMessagesObjectType;
        }
      }
      return { type: "unknown" };
    }),
);

export class Gemini {
  static baseURL = "https://generativelanguage.googleapis.com";

  public static async generateContent(
    modelName: string,
    messages: MessageObjectType[],
    steps?: RunStepObjectType[],
    instructions?: string | null,
    tools?: (
      | AssistantToolsCodeType
      | AssistantToolsFunctionType
      | AssistantToolsRetrievalType
    )[],
  ) {
    const contents: ContentType[] = messages.map((m) =>
      messageObjectToContent.parse(m)
    );

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

    const functions = tools?.filter((t) => t.type === "function").map((t) => ({
      ...(t as AssistantToolsFunctionType).function,
    }));

    const response = await this.fetch(
      `/v1beta/models/${modelName}:generateContent`,
      {
        method: "post",
        body: JSON.stringify({
          contents,
          tools: [{
            function_declarations: functions,
          }],
        }),
      },
    );
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
    return fetch(`${this.baseURL}${input}`, {
      ...init,
      headers: {
        ...init?.headers,
        "X-Goog-Api-Key": env["GOOGLE_API_KEY"],
      },
    });
  }
}
