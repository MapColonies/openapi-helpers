export class InvalidInputError extends Error {
  public readonly code = 'INVALID_INPUT';
  /**
   * Creates an instance of InvalidInputError.
   * @param message - The error message.
   * @param cause - Optional original error or server response data.
   */
  public constructor(message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MissingParameterError extends Error {
  public readonly code = 'MISSING_PARAMETER';
  /**
   * Creates an instance of MissingParameterError.
   * @param message - The error message.
   * @param cause - Optional original error or server response data.
   */
  public constructor(message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ResourceNotFoundError extends Error {
  public readonly code = 'RESOURCE_NOT_FOUND';
  /**
   * Creates an instance of ResourceNotFoundError.
   * @param message - The error message.
   * @param cause - Optional original error or server response data.
   */
  public constructor(message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InternalError extends Error {
  public readonly code = 'INTERNAL_ERROR';
  /**
   * Creates an instance of InternalError.
   * @param message - The error message.
   * @param cause - Optional original error or server response data.
   */
  public constructor(message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseError extends Error {
  public readonly code = 'DATABASE_ERROR';
  /**
   * Creates an instance of DatabaseError.
   * @param message - The error message.
   * @param cause - Optional original error or server response data.
   */
  public constructor(message: string, cause?: unknown) {
    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
