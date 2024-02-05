import { ulid } from "$std/ulid/mod.ts";
import { type ContentType, GenerateContentResponse } from "googleai_schemas";
import {
  MessageContentTextObject,
  MessageObject,
  RunStepDetailsToolCallsObject,
  type RunStepDetailsToolCallsObjectType,
} from "openai_schemas";
import { z } from "zod";

export const messageObjectToContent = MessageObject.transform(
  (message) =>
    ({
      role: message.role === "assistant" ? "model" : "user",
      parts: message.content.map((c) => {
        if (c.type === "text") {
          return { text: c.text.value };
        }
        return {};
      }),
    }) as ContentType,
);

export const runStepDetailsToolCallsToContents =
  RunStepDetailsToolCallsObject.transform((toolCalls) => {
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

function isFunctionCallParts(parts: object[]) {
  for (const p of parts) {
    if ("functionCall" in p) {
      return true;
    }
  }
  return false;
}
export const generateContentResponseToStepDetails =
  GenerateContentResponse.transform((v) =>
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
                function: {
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
