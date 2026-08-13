import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { messages } from "../api/messages";
import { AppError } from "./errors";

type DatabaseError = Error & { code?: string };

const errorLabel = (statusCode: number) => {
  if (statusCode === 400) return "Bad Request";
  if (statusCode === 401) return "Unauthorized";
  if (statusCode === 403) return "Forbidden";
  if (statusCode === 404) return "Not Found";
  if (statusCode === 409) return "Conflict";
  if (statusCode === 429) return "Too Many Requests";
  return "Request Error";
};

export const handleApiError = (
  error: FastifyError | AppError,
  req: FastifyRequest,
  res: FastifyReply,
) => {
  if (res.sent) return;

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      req.log.error({ err: error }, "Server configuration error");
      return res.status(500).send({ ...messages.somethingWentWrong });
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
      ...messages.clientDataError,
      message: error.message,
    });
  }

  const databaseError = error as DatabaseError;
  if (databaseError.code === "23503") {
    return res.status(409).send({ ...messages.foreignKeyError });
  }
  if (databaseError.code === "23505") {
    return res.status(409).send({ ...messages.duplicateData });
  }

  if (
    typeof error.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  ) {
    return res.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: errorLabel(error.statusCode),
      message: error.message,
    });
  }

  req.log.error({ err: error }, "Unhandled request error");
  return res.status(500).send({ ...messages.somethingWentWrong });
};
