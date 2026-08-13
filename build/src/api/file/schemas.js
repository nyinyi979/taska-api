"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUrlQuerySchema = exports.fileUrlBodySchema = void 0;
const type_provider_typebox_1 = require("@fastify/type-provider-typebox");
exports.fileUrlBodySchema = type_provider_typebox_1.Type.Object({
    url: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 2048 }),
});
exports.fileUrlQuerySchema = exports.fileUrlBodySchema;
