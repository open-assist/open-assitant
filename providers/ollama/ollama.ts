import { Ollama } from "ollama";
import { env } from "$/fresh.config.ts";

const ollama = new Ollama({ host: env["OLLAMA_HOST"] });

export default ollama;
