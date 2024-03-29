import * as log from "$std/log/mod.ts";
import { ulid } from "$std/ulid/mod.ts";
import { ZodError } from "zod";
import {
  ImageContent,
  TextContent,
  CreateMessageRequest,
  CreateMessageResponse,
  StopReason,
} from "@open-schemas/zod/anthropic";
import {
  CreateChatCompletionRequest,
  ChatCompletionObject,
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageContentPart,
  FinishReason,
  ChatCompletionToolCall,
} from "@open-schemas/zod/openai";
import { TOOL_STOP, CHAT_COMPLETION_PREFIX } from "$/consts/llm.ts";
import { TOOLS_PROMPT, FUNCTION_TOOLS_PROMPT } from "$/utils/prompts.ts";
import { XML } from "$/utils/xml.ts";
import { now } from "$/utils/date.ts";
import { genSystemFingerprint } from "$/utils/llm.ts";

/**
 * Parses a data URL string and returns an object containing the media type, type, and data.
 * Throws a ZodError if the URL is invalid.
 *
 * @param url The data URL string to parse.
 * @returns An object containing the media type, type, and data extracted from the URL.
 * @throws {ZodError} If the URL is invalid.
 */
function parseDataUrl(url: string) {
  const matches = url.match(/data:([\w\/]+);(base64),([\w\/\+=]+)/);
  if (!matches)
    throw new ZodError([
      {
        code: "invalid_string",
        path: ["messges", "content", "image_url", "url"],
        validation: "regex",
        message: "Invalid data url for images.",
      },
    ]);
  const [, media_type, type, data] = matches;
  return { media_type, type, data };
}

/**
 * Converts a ChatCompletionRequestMessage to a Message.
 * If the content is an array, it maps over the content and converts any image_url
 * types to the expected image type with a base64 data source.
 *
 * @param message The ChatCompletionRequestMessage to convert.
 * @returns The converted Message.
 */
export const CompletionMessagetoMessage =
  ChatCompletionRequestMessage.transform(
    (message: ChatCompletionRequestMessage) => {
      function convertContent(
        openAiContent: ChatCompletionRequestMessageContentPart,
      ) {
        if (openAiContent.type === "image_url") {
          const {
            image_url: { url },
          } = openAiContent;
          return ImageContent.parse({
            source: parseDataUrl(url),
          });
        }
        return TextContent.parse(openAiContent);
      }

      const { role, content } = message;

      let messageContent;
      if (role === "assistant") {
        let text = content;
        if (message.tool_calls) {
          text = `${text}\n${XML.stringify(
            {
              tool_calls: {
                tool_call: message.tool_calls,
              },
            },
            { format: true },
          )}`;
        }
        messageContent = [TextContent.parse({ text })];
      } else if (role === "tool") {
        const text = XML.stringify(
          {
            tool_results: {
              tool_result: {
                tool_call_id: message.tool_call_id,
                output: message.content,
              },
            },
          },
          { format: true },
        );
        messageContent = [TextContent.parse({ text })];
      } else {
        if (Array.isArray(content)) {
          messageContent = content.map(convertContent);
        } else {
          messageContent = [TextContent.parse({ text: content })];
        }
      }

      log.debug(
        `[completionMessagetoMessage] content: ${JSON.stringify(messageContent)}`,
      );
      return {
        role: role === "assistant" ? "assistant" : "user",
        content: messageContent,
      };
    },
  );

/**
 * Converts a CreateChatCompletionRequest to a CreateMessageRequest.
 * Maps over the messages and converts them to Messages using the completionMessagetoMessage function.
 * Extracts the system messages and joins their content into a single string.
 * Sets default values for max_tokens, temperature, top_p, and stream if not provided.
 *
 * @param request The CreateChatCompletionRequest to convert.
 * @returns The converted CreateMessageRequest.
 */
export const CompletionRequestToMessageRequest =
  CreateChatCompletionRequest.transform(
    (request: CreateChatCompletionRequest): CreateMessageRequest => {
      const { messages, max_tokens, user, stop, tools, ...rest } = request;
      const systemMessages = messages.filter((m) => m.role === "system");
      const supportMessages = messages.filter((m) =>
        ["user", "assistant", "tool"].includes(m.role),
      );

      function get_system(messages: string[]) {
        let system = "";
        if (messages.length > 0) {
          system = messages.join("\n");
        }
        if (tools && tools.length > 0) {
          const prompt = XML.stringify(tools, {
            arrayNodeName: "tool",
            format: true,
          });
          system = `${system}${TOOLS_PROMPT}${FUNCTION_TOOLS_PROMPT}\n<tools>\n${prompt}</tools>`;
        }

        log.debug(`[get_system] system:\n${system}`);
        return system;
      }

      function get_stop_sequences(stop: string | string[]) {
        const allStop = Array.isArray(stop) ? stop : [stop];
        if (tools && tools.length > 0) {
          return [TOOL_STOP, ...allStop];
        }
        return allStop;
      }

      return CreateMessageRequest.parse({
        ...rest,
        messages: supportMessages.map((m) =>
          CompletionMessagetoMessage.parse(m),
        ),
        metadata: user ? { user_id: user } : undefined,
        stop_sequences: get_stop_sequences(stop ?? []),
        system: get_system(systemMessages.map((m) => m.content as string)),
        max_tokens: max_tokens ?? 4096,
      });
    },
  );

/**
 * Converts a CreateMessageResponse to a ChatCompletionObject.
 * Maps over the content and extracts the text and tool calls (if any) from each content item.
 * Converts the stop_reason to a FinishReason using the convertStopReasonToFinishReason function.
 * Parses the tool calls from XML to ChatCompletionFunctionToolCall objects using the
 * parseXmlToFunctionToolCalls function. Sets default values for logprobs, created, and
 * system_fingerprint.
 *
 * @param response The CreateMessageResponse to convert.
 * @returns A promise that resolves to the converted ChatCompletionObject.
 */
export function parseXmlToFunctionToolCalls(xml: string) {
  const parts = xml.split("<calls>");
  const calls = XML.parse(parts[parts.length - 1]).tool_call;
  log.debug(`calls: ${JSON.stringify(calls)}`);
  const toolCalls = Array.isArray(calls) ? calls : [calls];
  return toolCalls.map(
    // deno-lint-ignore no-explicit-any
    (c: any, index: number) => {
      const {
        function: { name, parameters },
      } = c;
      return {
        type: "function",
        function: {
          name,
          arguments: JSON.stringify(parameters),
        },
        id: `call-${ulid()}`,
        index,
      } as ChatCompletionToolCall;
    },
  );
}

/**
 * Converts a StopReason to a FinishReason.
 * Maps the StopReason values to the corresponding FinishReason values.
 * If the stop_sequence is the TOOL_STOP constant, returns "tool_calls" as the FinishReason.
 *
 * @param reason The StopReason to convert.
 * @param sequence The stop_sequence that triggered the stop, if any.
 * @returns The converted FinishReason.
 */
export function convertStopReasonToFinishReason(
  reason: StopReason,
  sequence?: string | null,
): FinishReason {
  switch (reason) {
    case "max_tokens":
      return "length";
    case "end_turn":
      return "stop";
    case "stop_sequence":
      return TOOL_STOP === sequence ? "tool_calls" : "stop";
    default:
      return "content_filter";
  }
}

export const CreateMessageResponseToChatCompletionObject =
  CreateMessageResponse.transform(async (response: CreateMessageResponse) => {
    const { content, role, stop_reason, stop_sequence, usage, ...rest } =
      response;
    const finish_reason = convertStopReasonToFinishReason(
      stop_reason,
      stop_sequence,
    );
    return ChatCompletionObject.parse({
      ...rest,
      id: `${CHAT_COMPLETION_PREFIX}-${ulid()}`,
      choices: content.map((c, index) => {
        const parts = c.text.split("<calls>");
        const tool_calls =
          parts.length === 2
            ? parseXmlToFunctionToolCalls(parts[1])
            : undefined;
        return {
          index,
          finish_reason,
          message: {
            role,
            content: parts[0],
            tool_calls,
          },
        };
      }),
      usage: {
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        total_tokens: usage.input_tokens + usage.output_tokens,
      },
      created: now(),
      system_fingerprint: await genSystemFingerprint(),
    });
  });
