"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.ConfigurationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, message, error, code) {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.code = code;
        this.name = new.target.name;
    }
}
exports.AppError = AppError;
class ConfigurationError extends AppError {
    constructor(message) {
        super(500, message, "Configuration Error");
    }
}
exports.ConfigurationError = ConfigurationError;
class BadRequestError extends AppError {
    constructor(message, code) {
        super(400, message, "Bad Request", code);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = "A valid access token is required.") {
        super(401, message, "Unauthorized");
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to perform this action.") {
        super(403, message, "Forbidden");
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = "The requested record was not found.") {
        super(404, message, "Not Found");
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, code) {
        super(409, message, "Conflict", code);
    }
}
exports.ConflictError = ConflictError;
