"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamsSchema = exports.paginationQuerySchema = exports.paginationProperties = exports.orderBySchema = exports.removedImageUrlsSchema = exports.nullableUrlSchema = exports.uuidSchema = void 0;
const type_provider_typebox_1 = require("@fastify/type-provider-typebox");
exports.uuidSchema = type_provider_typebox_1.Type.String({ format: "uuid" });
exports.nullableUrlSchema = type_provider_typebox_1.Type.Union([
    type_provider_typebox_1.Type.String({ maxLength: 2048 }),
    type_provider_typebox_1.Type.Null(),
]);
exports.removedImageUrlsSchema = type_provider_typebox_1.Type.Array(type_provider_typebox_1.Type.Union([type_provider_typebox_1.Type.String(), type_provider_typebox_1.Type.Null()]));
exports.orderBySchema = type_provider_typebox_1.Type.Union([
    type_provider_typebox_1.Type.Literal("asc"),
    type_provider_typebox_1.Type.Literal("desc"),
]);
exports.paginationProperties = {
    page: type_provider_typebox_1.Type.Integer({ minimum: 0 }),
    perPage: type_provider_typebox_1.Type.Integer({ minimum: 1, maximum: 100 }),
};
exports.paginationQuerySchema = type_provider_typebox_1.Type.Object(exports.paginationProperties);
exports.idParamsSchema = type_provider_typebox_1.Type.Object({ id: exports.uuidSchema });
