import {
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageContentPartType,
} from "openai_schemas";
import { z } from "zod";
import {
  TOOLS_PROMPT,
  FUNCTION_TOOLS_PROMPT,
  USER_PROMPT,
} from "$/utils/prompts.ts";
import { XML } from "$/utils/xml.ts";
import * as log from "$std/log/mod.ts";
import { TOOL_STOP } from "$/consts/llm.ts";
import { now } from "$/utils/date.ts";

export const TextContent = z.object({
  type: z.enum(["text"]).default("text"),
  text: z.string(),
});
export type TextContent = z.infer<typeof TextContent>;

export const ImageContent = z.object({
  type: z.enum(["image"]).default("image"),
  source: z.object({
    type: z.enum(["base64"]).default("base64"),
    media_type: z.enum(["image/jpeg", "image/png", "image/gif"]).nullish(),
    data: z.string(),
  }),
});
export type ImageContent = z.infer<typeof ImageContent>;

export const Content = z.union([TextContent, ImageContent]);
export type Content = z.infer<typeof Content>;

export const Message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(Content)]).nullish(),
});
export type Message = z.infer<typeof Message>;

export const CreateMessageRequest = z.object({
  model: z.string(),
  messages: z.array(Message).min(1),
  system: z.string().nullish(),
  max_tokens: z.number().min(1).max(4096),
  metadata: z
    .object({
      user_id: z.string(),
    })
    .nullish(),
  stop_sequences: z.array(z.string()).nullish(),
  stream: z.boolean().default(false).nullish(),
  temperature: z.number().min(0).max(1).default(1).nullish(),
  top_p: z.number().nullish(),
  top_k: z.number().nullish(),
});
export type CreateMessageRequest = z.infer<typeof CreateMessageRequest>;

export const MessageUsage = z.object({
  input_tokens: z.number().optional(),
  output_tokens: z.number().optional(),
});
export type MessageUsage = z.infer<typeof MessageUsage>;

export const StopReason = z.enum(["end_turn", "max_tokens", "stop_sequence"]);
export type StopReason = z.infer<typeof StopReason>;

export const CreateMessageResponse = z.object({
  id: z.string(),
  type: z.enum(["message"]).default("message"),
  role: z.enum(["assistant"]).default("assistant"),
  content: z.array(TextContent),
  model: z.string(),
  stop_reason: StopReason.nullish(),
  stop_sequence: z.string().nullish(),
  usage: MessageUsage.nullish(),
});
export type CreateMessageResponse = z.infer<typeof CreateMessageResponse>;

export const MessageStartEvent = z.object({
  type: z.enum(["message_start"]).default("message_start"),
  message: z.object({
    id: z.string(),
    type: z.enum(["message"]).default("message"),
    role: z.string(),
    content: z.array(z.any()),
    model: z.string(),
    stop_reason: StopReason.nullish(),
    usage: MessageUsage.nullish(),
  }),
});
export type MessageStartEvent = z.infer<typeof MessageStartEvent>;

export const MessageDeltaEvent = z.object({
  type: z.enum(["message_delta"]).default("message_delta"),
  delta: z.object({
    stop_reason: StopReason.nullish(),
    stop_sequence: z.string().nullish(),
  }),
  usage: MessageUsage.nullish(),
});
export type MessageDeltaEvent = z.infer<typeof MessageDeltaEvent>;

export const MessageStopEvent = z.object({
  type: z.enum(["message_stop"]).default("message_stop"),
});
export type MessageStopEvent = z.infer<typeof MessageStopEvent>;

export const ContentBlockDeltaEvent = z.object({
  type: z.enum(["content_block_delta"]).default("content_block_delta"),
  index: z.number(),
  delta: z.object({
    type: z.string(),
    text: z.string(),
  }),
});
export type ContentBlockDeltaEvent = z.infer<typeof ContentBlockDeltaEvent>;

/**
 * Converts a ChatCompletionRequestMessage to a Message.
 * If the content is an array, it maps over the content and converts any image_url
 * types to the expected image type with a base64 data source.
 *
 * @param message The ChatCompletionRequestMessage to convert.
 * @returns The converted Message.
 */
export const CompletionMessagetoMessage =
  ChatCompletionRequestMessage.transform((message): Message => {
    function convertContent(
      openAiContent: ChatCompletionRequestMessageContentPartType,
    ) {
      if (openAiContent.type === "image_url") {
        return ImageContent.parse({
          source: { data: openAiContent.image_url.url },
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
  });

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
  CreateChatCompletionRequest.transform((request): CreateMessageRequest => {
    const {
      model,
      messages,
      max_tokens,
      user,
      temperature,
      top_p,
      stop,
      stream,
      tools,
    } = request;
    const systemMessages = messages.filter((m) => m.role === "system");
    const supportMessages = messages.filter((m) =>
      ["user", "assistant", "tool"].includes(m.role),
    );

    function get_system(messages: string[]) {
      let system = "";
      if (tools && tools.length > 0) {
        const prompt = XML.stringify(tools, {
          arrayNodeName: "tool",
          format: true,
        });
        log;
        system = `${system}${TOOLS_PROMPT}${FUNCTION_TOOLS_PROMPT}${prompt}`;
      }
      if (messages.length > 0) {
        system = `${system}${USER_PROMPT}${messages.join("\n")}`;
      }
      log.debug(`[get_system] system:\n${system}`);
      return system;
    }

    function get_stop_sequences(stop: string | string[]) {
      const allStop = Array.isArray(stop) ? stop : [stop];
      if (tools && tools.length > 0) {
        return [...TOOL_STOP, ...allStop];
      }
      return allStop;
    }

    return {
      model,
      messages: supportMessages.map((m) => CompletionMessagetoMessage.parse(m)),
      metadata: user ? { user_id: user } : undefined,
      stop_sequences: get_stop_sequences(stop ?? []),
      system: get_system(systemMessages.map((m) => m.content as string)),
      max_tokens: max_tokens ?? 4096,
      temperature,
      top_p,
      stream,
    };
  });

export const CreateMessageResponseToCreateChatCompletionResponse =
  CreateMessageResponse.transform((response) => {
    const { content, role, stop_reason, usage, ...rest } = response;
    return CreateChatCompletionResponse.parse({
      ...rest,
      choices: [
        {
          logprobs: null,
          index: 0,
          message: {
            role,
            content: content.map((c) => c.text).join("\n"),
          },
          finish_reason:
            stop_reason && stop_reason === "max_tokens" ? "length" : "stop",
        },
      ],
      usage: usage && {
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
      },
      created: now(),
      object: "chat.completion",
      system_fingerprint: "fp_open_assistant",
    });
  });
