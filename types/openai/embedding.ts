export type EmbeddingObject = {
  /**
   * The object type, which is always "embedding".
   *
   * @default embedding
   */
  obejct: "embedding";
  /**
   * The embedding vector, which is a list of floats. The length of vector depends on the model as listed in the embedding guide.
   */
  embedding: number[];
  /**
   * The index of the embedding in the list of embeddings.
   */
  index: number;
};

/**
 * Creates an embedding vector representing the input text.
 */
export type CreateEmbeddingRequest = {
  /**
   * Input text to embed, encoded as a string or array of tokens. To embed multiple inputs in a single request, pass an array of strings or array of token arrays. The input must not exceed the max input tokens for the model, cannot be an empty string, and any array must be 2048 dimensions or less.
   *
   * string - The string that will be turned into an embedding.
   * string[] - The array of strings that will be turned into an embedding.
   * number[] - The array of integers that will be turned into an embedding.
   * number[][] - The array of arrays containing integers that will be turned into an embedding.
   */
  input: string | string[] | number[] | number[][];

  /**
   * ID of the model to use. You can use the List models API to see all of your available models, or see our Model overview for descriptions of them.
   */
  model: string;

  /**
   * The format to return the embeddings in. Can be either float or base64.
   *
   * @default float
   */
  encoding_format?: "float" | "base64" | null;

  /**
   * The number of dimensions the resulting output embeddings should have. Only supported in text-embedding-3 and later models.
   */
  dimensions?: number | null;

  /**
   * A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.
   */
  user?: string | null;
};

/**
 * A list of embedding objects.
 */
export type CreateEmbeddingResponse = {
  /**
   * The object type, which is always "list".
   *
   * @default list
   */
  object: "list";
  data: EmbeddingObject[];
  /**
   * ID of the model to use.
   */
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
};
