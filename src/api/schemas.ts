import { Static, Type } from "@fastify/type-provider-typebox";

export const uuidSchema = Type.String({ format: "uuid" });
export const nullableUrlSchema = Type.Union([
  Type.String({ maxLength: 2048 }),
  Type.Null(),
]);
export const removedImageUrlsSchema = Type.Array(
  Type.Union([Type.String(), Type.Null()]),
);
export const orderBySchema = Type.Union([
  Type.Literal("asc"),
  Type.Literal("desc"),
]);
export const paginationProperties = {
  page: Type.Integer({ minimum: 0 }),
  perPage: Type.Integer({ minimum: 1, maximum: 100 }),
};
export const paginationQuerySchema = Type.Object(paginationProperties);
export const idParamsSchema = Type.Object({ id: uuidSchema });

export type PagKeys = Static<typeof paginationQuerySchema>;
export type IdParams = Static<typeof idParamsSchema>;
