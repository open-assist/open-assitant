export const LOG_LEVEL = "LOG_LEVEL";
export const FILE_DIR = "FILE_DIR";
// export const FILE_SIZE_MAX = "FILE_SIZE_MAX";
export const ORG_FILES_SIZE_MAX = "ORG_FILES_SIZE_MAX";

export const DEFAULT_FILE_DIR = "/tmp/assistant";
// export const DEFAULT_FILE_SIZE_MAX = 512_000_000; // 512MB
export const DEFAULT_ORG_FILES_SIZE_MAX = 100_000_000_000; // 100GB

// the env var name of google ai api url
export const GOOGLE_API_URL = "GOOGLE_API_URL";
export const GOOGLE_API_KEY = "GOOGLE_API_KEY";

// the env var name of ollama api url
export const OLLAMA_API_URL = "OLLAMA_API_URL";

// chat completion object
export const CHAT_COMPLETION_OBJECT = "chat.completion";
export const CHAT_COMPLETION_CHUNK_OBJECT = "chat.completion.chunk";

// id prefix of chat completion object
export const CHAT_COMPLETION_PREFIX = "chatcmpl";
export const CHAT_COMPLETION_DONE_EVENT = "data: [DONE]\n\n";
