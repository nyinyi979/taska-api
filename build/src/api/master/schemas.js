"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityQuerySchema = exports.stateQuerySchema = void 0;
const type_provider_typebox_1 = require("@fastify/type-provider-typebox");
exports.stateQuerySchema = type_provider_typebox_1.Type.Object({
    country: type_provider_typebox_1.Type.String({ minLength: 1 }),
});
exports.cityQuerySchema = type_provider_typebox_1.Type.Object({
    country: type_provider_typebox_1.Type.String({ minLength: 1 }),
    state: type_provider_typebox_1.Type.String({ minLength: 1 }),
});
