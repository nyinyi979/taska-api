export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly error: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(500, message, "Configuration Error");
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code?: string) {
    super(400, message, "Bad Request", code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "A valid access token is required.") {
    super(401, message, "Unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super(403, message, "Forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested record was not found.") {
    super(404, message, "Not Found");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(409, message, "Conflict", code);
  }
}
