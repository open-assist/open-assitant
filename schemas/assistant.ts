import type { MessageTextContent, ToolCall, Usage } from "$open-schemas/types/openai/mod.ts";

/**
 * Unified assistant response for Open Assistant.
 */
export type AssistantResponse = {
  content?: MessageTextContent;
  tool_calls?: ToolCall[];
  usage: Usage;
};
