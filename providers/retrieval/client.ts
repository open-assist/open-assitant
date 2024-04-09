import { getEnv } from "$/utils/env.ts";
import { RETRIEVAL_PROVIDER } from "$/consts/envs.ts";
import { OPEN_RETRIEVAL } from "$/consts/retrieval.ts";
import { OpenRetrieval } from "$/providers/retrieval/open_retrieval.ts";

export function getClient() {
  const provider = getEnv(RETRIEVAL_PROVIDER);

  switch (provider) {
    case OPEN_RETRIEVAL:
      return OpenRetrieval;
    default:
      throw new Error(`Try one of the following: ${OPEN_RETRIEVAL}.`, {
        cause: `Unsupported Retrieval provider: ${provider}.`,
      });
  }
}
