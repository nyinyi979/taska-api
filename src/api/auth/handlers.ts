import { FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../../utils/auth";
import { messages } from "../messages";
import { TypeBoxRequest } from "../request";
import { idParamsSchema, paginationQuerySchema } from "../schemas";
import {
  deleteUser,
  getUserById,
  getUsers,
  login,
  signup,
  updateUser,
} from "./controllers";
import {
  loginBodySchema,
  signupBodySchema,
  updateUserBodySchema,
} from "./schemas";

export const handleSignup = async (
  req: TypeBoxRequest<{ body: typeof signupBodySchema }>,
  res: FastifyReply,
) => {
  try {
    const data = await signup(req.body);
    if (!data) return res.status(409).send({ ...messages.duplicateEmail });
    return res.status(201).send({ ...messages.createOk, data });
  } catch (err) {
    throw err;
  }
};

export const handleLogin = async (
  req: TypeBoxRequest<{ body: typeof loginBodySchema }>,
  res: FastifyReply,
) => {
  try {
    const data = await login(req.body);
    return res.code(200).send({ ...messages.verifyOk, data });
  } catch (err) {
    throw err;
  }
};

export const handleGetUsers = async (
  req: TypeBoxRequest<{ querystring: typeof paginationQuerySchema }>,
  res: FastifyReply,
) => {
  try {
    const response = await getUsers(req.query);
    return res.code(200).send({ ...messages.verifyOk, ...response });
  } catch (err) {
    throw err;
  }
};

export const handleGetUserById = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => {
  try {
    const response = await getUserById(req.params.id);
    return res.code(200).send({ ...messages.verifyOk, data: response });
  } catch (err) {
    throw err;
  }
};

export const handleGetUserByToken = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  try {
    const data = await authenticate(req, res);
    return res.code(200).send({ ...messages.verifyOk, data });
  } catch (err) {
    throw err;
  }
};

export const handleUpdateUser = async (
  req: TypeBoxRequest<{ body: typeof updateUserBodySchema }>,
  res: FastifyReply,
) => {
  try {
    const data = await updateUser(req.body);
    return res.code(200).send({ ...messages.updateOk, data });
  } catch (err) {
    throw err;
  }
};

export const handleDeleteAdmin = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => {
  try {
    const data = await deleteUser(req.params.id);
    return res.code(200).send({ ...messages.deleteOk, data });
  } catch (err) {
    throw err;
  }
};
