import Base from "$/providers/client/google.ts";
import {
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
} from "$/schemas/openai/embedding.ts";
import {
  EmbedContentRequest,
  EmbedContentResponse,
} from "$/schemas/google/mod.ts";

export default class Google extends Base {
  static async createEmbedding(
    request: CreateEmbeddingRequest,
    mappedModel?: string,
  ): Promise<CreateEmbeddingResponse> {
    const ecq = CreateEmbeddingRequest.transform(
      ({ input, dimensions }): EmbedContentRequest => {
        let parts: EmbedContentRequest["content"]["parts"] = [];
        if (typeof input === "string") {
          parts = [{
            text: input,
          }];
        } else {
          if (input.every((item) => typeof item === "string")) {
            parts = input.map((i) => ({ text: i as string }));
          }
        }
        return {
          content: { parts },
          outputDimensionality: dimensions,
        };
      },
    )
      .parse(request);

    const ecp = await this.fetch(`/${request.model}:embedContent`, {
      method: "POST",
      body: JSON.stringify(ecq),
    });

    return EmbedContentResponse.transform(
      ({ embedding }): CreateEmbeddingResponse => {
        return {
          object: "list",
          data: [
            {
              obejct: "embedding",
              embedding: embedding.values,
              index: 0,
            },
          ],
          model: mappedModel ?? request.model,
          usage: {
            prompt_tokens: 0,
            total_tokens: 0,
          },
        };
      },
    ).parse(ecp);
  }
}
