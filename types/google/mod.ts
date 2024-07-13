export type Part = {
  /**
   * Inline text.
   */
  text: string;
} | {
  inlineData: {
    /**
     * The IANA standard MIME type of the source data. Examples: - image/png - image/jpeg If an unsupported MIME type is provided, an error will be returned.
     */
    mimeType: string;
    /**
     * Raw bytes for media formats. A base64-encoded string.
     */
    data: string;
  };
};

/**
 * The base structured datatype containing multi-part content of a message.
 * A Content includes a role field designating the producer of the Content and a parts field containing multi-part data that contains the content of the message turn.
 */
export type Content = {
  /**
   * Ordered Parts that constitute a single message. Parts may have different MIME types.
   */
  parts: Part[];
  /**
   * The producer of the content. Must be either 'user' or 'model'.
   * Useful to set for multi-turn conversations, otherwise can be left blank or unset.
   */
  role?: "use" | "model";
};

/**
 * Type of task for which the embedding will be used.
 */
export type TaskType =
  | "TASK_TYPE_UNSPECIFIED" // Unset value, which will default to one of the other enum values.
  | "RETRIEVAL_QUERY" // Specifies the given text is a query in a search/retrieval setting.
  | "RETRIEVAL_DOCUMENT" // Specifies the given text is a document from the corpus being searched.
  | "SEMANTIC_SIMILARITY" // Specifies the given text will be used for STS.
  | "CLASSIFICATION" // Specifies that the given text will be classified.
  | "CLUSTERING" // Specifies that the embeddings will be used for clustering.
  | "QUESTION_ANSWERING" // Specifies that the given text will be used for question answering.
  | "FACT_VERIFICATION"; // Specifies that the given text will be used for fact verification.

export type EmbedContentRequest = {
  /**
   * The content to embed. Only the parts.text fields will be counted.
   */
  content: Content;
  /**
   * Optional task type for which the embeddings will be used. Can only be set for models/embedding-001.
   */
  taskType?: TaskType;
  /**
   * An optional title for the text. Only applicable when TaskType is RETRIEVAL_DOCUMENT.
   * Note: Specifying a title for RETRIEVAL_DOCUMENT provides better quality embeddings for retrieval.
   */
  title?: string;
  /**
   * Optional reduced dimension for the output embedding. If set, excessive values in the output
   * embedding are truncated from the end. Supported by newer models since 2024, and the earlier
   * model (models/embedding-001) cannot specify this value.
   */
  outputDimensionality?: number | null;
};

/**
 * A list of floats representing an embedding.
 */
export type ContentEmbedding = {
  /**
   * The embedding values.
   */
  values: number[];
};

export type EmbedContentResponse = {
  /**
   * The embedding generated from the input content.
   */
  embedding: ContentEmbedding;
};
