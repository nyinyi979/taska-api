"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiError = void 0;
const messages_1 = require("../api/messages");
const errors_1 = require("./errors");
const errorLabel = (statusCode) => {
    if (statusCode === 400)
        return "Bad Request";
    if (statusCode === 401)
        return "Unauthorized";
    if (statusCode === 403)
        return "Forbidden";
    if (statusCode === 404)
        return "Not Found";
    if (statusCode === 409)
        return "Conflict";
    if (statusCode === 429)
        return "Too Many Requests";
    return "Request Error";
};
const handleApiError = (error, req, res) => {
    if (res.sent)
        return;
    if (error instanceof errors_1.AppError) {
        if (error.statusCode >= 500) {
            req.log.error({ err: error }, "Server configuration error");
            return res.status(500).send({ ...messages_1.messages.somethingWentWrong });
        }
        req.log.warn({ err: error }, "Request rejected");
        return res.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: error.error,
            message: error.message,
            ...(error.code ? { code: error.code } : {}),
        });
    }
    if (error.validation) {
        return res.status(400).send({
            ...messages_1.messages.clientDataError,
            message: error.message,
        });
    }
    const databaseError = error;
    if (databaseError.code === "23503") {
        return res.status(409).send({ ...messages_1.messages.foreignKeyError });
    }
    if (databaseError.code === "23505") {
        return res.status(409).send({ ...messages_1.messages.duplicateData });
    }
    if (typeof error.statusCode === "number" &&
        error.statusCode >= 400 &&
        error.statusCode < 500) {
        return res.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: errorLabel(error.statusCode),
            message: error.message,
        });
    }
    req.log.error({ err: error }, "Unhandled request error");
    return res.status(500).send({ ...messages_1.messages.somethingWentWrong });
};
exports.handleApiError = handleApiError;
