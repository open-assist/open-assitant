export class NotImplemented extends Error {
  constructor() {
    super(`Method is not implemented`);
  }
}

export class ConfigurationNotSet extends Error {
  constructor(name: string) {
    super(`The configuration(${name}) is not set.`);
  }
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: object[];
}

/**
 * status : 400
 */
export class BadRequest extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.message = message || "Bad Request";
  }
}

/**
 * status: 401
 */
export class Unauthorized extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.message = message || "Unauthorized";
  }
}

/**
 * status: 404
 */
export class NotFound extends Error {
  instance: string | undefined = undefined;

  constructor(params: {
    message?: string;
    options?: ErrorOptions;
    instance?: string;
  }) {
    super(params.message, params.options);
    this.message = params.message || "Not Found";
    this.instance = params.instance;
  }
}

/**
 * status: 422
 */
export class UnprocessableContent extends Error {
  errors: object[] | undefined = [];

  constructor(message?: string, options?: ErrorOptions, errors?: object[]) {
    super(message, options);
    this.message = message || "Unprocessable Content";
    this.errors = errors;
  }
}

/**
 * status: 429
 */
export class TooManyRequests extends Error {}

/**
 * status: 500
 */
export class InternalServerError extends Error {}

export class DbCommitError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.message = message || "Database Commit Error";
    this.cause = options?.cause || "Commit failed, try again later.";
  }
}

export class ServerError extends Error {}

export class RateLimitExceeded extends Error {}
