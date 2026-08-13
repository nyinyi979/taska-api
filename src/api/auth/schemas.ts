import { Static, Type } from "@fastify/type-provider-typebox";
import { paginationQuerySchema } from "../schemas";

export const loginBodySchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 1, maxLength: 255 }),
});

export const signupBodySchema = Type.Object({
  username: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: "email", maxLength: 100 }),
  password: Type.String({ minLength: 8, maxLength: 255 }),
});

export const updateUserBodySchema = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
    username: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
    email: Type.Optional(Type.String({ format: "email", maxLength: 100 })),
    password: Type.Optional(
      Type.Union([Type.String({ minLength: 8, maxLength: 255 }), Type.Null()]),
    ),
    role: Type.Optional(Type.Integer()),
  },
  { minProperties: 2 },
);

export type TLogin = Static<typeof loginBodySchema>;
export type TSignup = Static<typeof signupBodySchema>;
export type TUpdate = Static<typeof updateUserBodySchema>;
export type UserReadRequest = Static<typeof paginationQuerySchema>;
