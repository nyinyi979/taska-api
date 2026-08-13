import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { sign, verify } from "jsonwebtoken";
import db from "../../db";
import { usersTable } from "../../db/user";
import {
  ConfigurationError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors";
import type { TLogin, TSignup, TUpdate, UserReadRequest } from "./schemas";

export const signup = async (data: TSignup) => {
  const existingUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, data.email),
    columns: { id: true },
  });
  if (existingUser) return null;

  const password = await bcrypt.hash(data.password, 10);
  const response = await db
    .insert(usersTable)
    .values({
      username: data.username,
      email: data.email,
      password,
      role: 0,
    })
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
    });

  return response[0];
};

export const login = async (data: TLogin) => {
  const user = await db.query.usersTable.findFirst({
    columns: {
      id: true,
      username: true,
      password: true,
      email: true,
      role: true,
    },
    where: eq(usersTable.email, data.email),
  });
  if (!user) throw new UnauthorizedError("The email or password is incorrect.");

  const passwordMatches = await bcrypt.compare(data.password, user.password);
  if (!passwordMatches) {
    throw new UnauthorizedError("The email or password is incorrect.");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ConfigurationError("JWT_SECRET is not configured");

  const token = sign({ id: user.id, accountType: "admin" }, secret, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
  const { password: _password, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getUsers = async ({ page, perPage }: UserReadRequest) => {
  return db.transaction(async (tx) => {
    const data = await tx.query.usersTable.findMany({
      limit: perPage,
      offset: page * perPage,
      columns: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
    const count = await tx.$count(usersTable);
    return { data, count };
  });
};

export const getUserById = async (id: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, id),
    columns: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const getUserByToken = async (token: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ConfigurationError("JWT_SECRET is not configured");

  const payload = verify(token, secret, { algorithms: ["HS256"] });
  if (
    typeof payload === "string" ||
    typeof payload.id !== "string" ||
    payload.accountType !== "admin"
  ) {
    throw new UnauthorizedError("Invalid token payload.");
  }

  return getUserById(payload.id);
};

export const updateUser = async (data: TUpdate) => {
  const user = await db.query.usersTable.findFirst({
    columns: { id: true, password: true },
    where: eq(usersTable.id, data.id),
  });
  if (!user) throw new NotFoundError("User not found");

  const { id, password, ...updates } = data;
  const response = await db
    .update(usersTable)
    .set({
      ...updates,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    })
    .where(eq(usersTable.id, id))
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
    });
  return response[0];
};

export const deleteUser = async (id: string) => {
  return db.delete(usersTable).where(eq(usersTable.id, id)).returning({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
    role: usersTable.role,
  });
};
