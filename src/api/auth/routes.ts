import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { authenticate, authenticateAdmin } from "../../utils/auth";
import { idParamsSchema, paginationQuerySchema } from "../schemas";
import {
  handleDeleteAdmin,
  handleGetUserById,
  handleGetUserByToken,
  handleGetUsers,
  handleLogin,
  handleSignup,
  handleUpdateUser,
} from "./handlers";
import {
  loginBodySchema,
  signupBodySchema,
  updateUserBodySchema,
} from "./schemas";

const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    "/register",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Create an account",
        body: signupBodySchema,
      },
    },
    handleSignup,
  );
  app.post(
    "/login",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Log in",
        body: loginBodySchema,
      },
    },
    handleLogin,
  );
  app.get(
    "",
    {
      preHandler: authenticateAdmin,
      schema: {
        tags: ["Authentication"],
        summary: "List users",
        security: [{ accessToken: [] }],
        querystring: paginationQuerySchema,
      },
    },
    handleGetUsers,
  );
  app.get(
    "/:id",
    {
      preHandler: authenticateAdmin,
      schema: {
        tags: ["Authentication"],
        summary: "Get a user by ID",
        security: [{ accessToken: [] }],
        params: idParamsSchema,
      },
    },
    handleGetUserById,
  );
  app.get(
    "/me",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Authentication"],
        summary: "Get the current user",
        security: [{ accessToken: [] }],
      },
    },
    handleGetUserByToken,
  );
  app.put(
    "/",
    {
      preHandler: authenticateAdmin,
      schema: {
        tags: ["Authentication"],
        summary: "Update a user",
        security: [{ accessToken: [] }],
        body: updateUserBodySchema,
      },
    },
    handleUpdateUser,
  );
  app.delete(
    "/:id",
    {
      preHandler: authenticateAdmin,
      schema: {
        tags: ["Authentication"],
        summary: "Delete a user",
        security: [{ accessToken: [] }],
        params: idParamsSchema,
      },
    },
    handleDeleteAdmin,
  );
};

export default authRoutes;
