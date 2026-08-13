import { Static, Type } from "@fastify/type-provider-typebox";

export const fileUrlBodySchema = Type.Object({
  url: Type.String({ minLength: 1, maxLength: 2048 }),
});
export const fileUrlQuerySchema = fileUrlBodySchema;

export type FileUrlBody = Static<typeof fileUrlBodySchema>;
export type FileUrlQuery = Static<typeof fileUrlQuerySchema>;
