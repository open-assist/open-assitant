export type ChatCompletionRequestSystemMessage = {
  content: string;
  /**
   * @default system
   */
  role: "system";
  name?: string;
};

export type ChatCompletionRequestMessageTextContentPart = {
  /**
   * @default text
   */
  type: "text";
  text: string;
};

export type ChatCompletionRequestMessageImageContentPart = {
  /**
   * @default image_url
   */
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "hight";
  };
};

export type ChatCompletionRequestMessageContentPart =
  | ChatCompletionRequestMessageTextContentPart
  | ChatCompletionRequestMessageImageContentPart;

export type ChatCompletionRequestUserMessage = {
  content: string | ChatCompletionRequestMessageContentPart[];
  /**
   * @default user
   */
  role: "user";
  name?: string;
};

export type ChatCompletionMessageToolCall = {
  id: string;
  /**
   * @default function
   */
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatCompletionRequestAssistantMessage = {
  content?: string;
  /**
   * @default assistant
   */
  role: "assistant";
  name?: string;
  tool_calls?: ChatCompletionMessageToolCall[];
};

export type ChatCompletionRequestToolMessage = {
  /**
   * @default tool
   */
  role: "tool";
  content: string;
  tool_call_id: string;
};

export type ChatCompletionRequestMessage =
  | ChatCompletionRequestSystemMessage
  | ChatCompletionRequestUserMessage
  | ChatCompletionRequestAssistantMessage
  | ChatCompletionRequestToolMessage;

export type ChatCompletionTool = {
  /**
   * @default function
   */
  type: "function";
  function: {
    name: string;
    description?: string;
    // deno-lint-ignore no-explicit-any
    parameters?: any;
  };
};

export type CreateChatCompletionRequest = {
  messages: ChatCompletionRequestMessage[];
  model: string;
  /**
   * @maximum 2.0
   * @minimum '-2.0
   * @default 0
   */
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  /**
   * @maximum 20
   * @minimum 0
   */
  top_logprobs?: number;
  max_tokens?: number;
  /**
   * @default 1
   */
  n?: number;
  /**
   * @maximum 2.0
   * @minimum '-2.0
   * @default 0
   */
  presence_penalty?: number;
  /**
   * @default { type: 'text' }
   */
  response_format?: {
    /**
     * @default text
     */
    type: "text" | "json_object";
  };
  seed?: number | null;
  /**
   * Specifies the latency tier to use for processing the request. This parameter is relevant for
   * customers subscribed to the scale tier service:
   * - If set to 'auto', the system will utilize scale tier credits until they are exhausted.
   * - If set to 'default', the request will be processed using the default service tier with a
   *   lower uptime SLA and no latency guarentee.
   * When this parameter is set, the response body will include the service_tier utilized.
   */
  service_tier?: string | null;
  /**
   * Up to 4 sequences where the API will stop generating further tokens.
   */
  stop?: string | string[] | null;
  /**
   * If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as data-only
   * server-sent events as they become available, with the stream terminated by a data: [DONE]
   * message.
   *
   * @default false
   */
  stream?: boolean;
  /**
   * Options for streaming response. Only set this when you set stream: true.
   */
  stream_options?: {
    /**
     * If set, an additional chunk will be streamed before the data: [DONE] message. The usage
     * field on this chunk shows the token usage statistics for the entire request, and the choices
     * field will always be an empty array. All other chunks will also include a usage field, but
     * with a null value.
     */
    include_usage?: boolean;
  } | null;
  /**
   * @maximum 2
   * @minimum 0
   * @default 1
   */
  temperature?: number;
  /**
   * @default 1
   */
  top_p?: number;
  tools?: ChatCompletionTool[];
  tool_choice?:
    | "none"
    | "auto"
    | "required"
    | {
      type: "function";
      function: {
        name: string;
      };
    };
  /**
   * Whether to enable parallel function calling during tool use.
   *
   * @default true
   */
  parallel_tool_calls?: boolean;
  /**
   * A unique identifier representing your end-user, which can help OpenAI to monitor and detect
   * abuse.
   */
  user?: string;
};

export type ChatCompletionToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type FinishReason = "stop" | "length" | "content_filter" | "tool_calls";

export type ChatCompletionLogprobs = {
  content?: {
    token: string;
    logprob: number;
    bytes?: number[];
    top_logprobs: {
      token: string;
      logprob: number;
      bytes?: number[];
    };
  }[];
};

export type ChatCompletionChoiceContent = {
  content?: string;
  tool_calls?: ChatCompletionToolCall[];
  /**
   * @default assistant
   */
  role: "assistant";
};

export type ChatCompletionChoice = {
  finish_reason: FinishReason;
  /**
   * @minimum 0
   */
  index: number;
  message: ChatCompletionChoiceContent;
  logprobs?: ChatCompletionLogprobs;
};

export type Usage = {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
};

/**
 * Represents a chat completion response returned by model, based on the provided input.
 */
export type ChatCompletionObject = {
  /** */
  id: string;
  choices: ChatCompletionChoice[];
  created: number;
  model: string;
  service_tier?: string | null;
  system_fingerprint?: string;
  /**
   * The object type, which is always `chat.completion`.
   *
   * @default chat.completion
   */
  object: "chat.completion";
  usage: Usage;
};

export type ChatCompletionChunkChoice = {
  delta: ChatCompletionChoiceContent;
  logprobs?: ChatCompletionLogprobs;
  finish_reason?: FinishReason;
  /**
   * @minimum 0
   */
  index: number;
};

export type ChatCompletionChunkObject = {
  id: string;
  choices: ChatCompletionChunkChoice[];
  created: number;
  model: string;
  system_fingerprint: string;
  /**
   * The object type, which is always `chat.completion`.
   *
   * @default chat.completion.chunk
   */
  object: "chat.completion.chunk";
  /**
   * An optional field that will only be present when you set stream_options: {"include_usage": true}
   * in your request. When present, it contains a null value except for the last chunk which contains
   * the token usage statistics for the entire request.
   */
  usage?: Usage;
};
