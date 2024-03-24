export type ChatCompletionObject = {
  id: string;
  choices: {
    finish_reason: string;
    index: number;
  }[];
  created: number;
  model: string;
  system_fingerprint: string;
  object: "chat.completion";
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
};
