import { FastifyReply, FastifyRequest } from "fastify";
import { getUserByToken } from "../api/auth/controllers";
import { AppError, ForbiddenError, UnauthorizedError } from "./errors";

const getAccessToken = (req: FastifyRequest) => {
  const token = req.headers["x-access-token"];
  if (!token || typeof token !== "string") throw new UnauthorizedError();
  return token;
};

const rethrowServerError = (error: unknown) => {
  if (error instanceof AppError && error.statusCode >= 500) throw error;
};

export const authenticate = async (req: FastifyRequest, _res: FastifyReply) => {
  try {
    return await getUserByToken(getAccessToken(req));
  } catch (error) {
    rethrowServerError(error);
    throw new UnauthorizedError();
  }
};

export const authenticateAdmin = async (
  req: FastifyRequest,
  _res: FastifyReply,
) => {
  try {
    const user = await getUserByToken(getAccessToken(req));
    if (user.role !== 1) throw new ForbiddenError();
    return user;
  } catch (error) {
    rethrowServerError(error);
    if (error instanceof ForbiddenError) throw error;
    throw new UnauthorizedError();
  }
};
