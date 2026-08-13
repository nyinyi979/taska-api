"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserBodySchema = exports.signupBodySchema = exports.loginBodySchema = void 0;
const type_provider_typebox_1 = require("@fastify/type-provider-typebox");
exports.loginBodySchema = type_provider_typebox_1.Type.Object({
    email: type_provider_typebox_1.Type.String({ format: "email" }),
    password: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 255 }),
});
exports.signupBodySchema = type_provider_typebox_1.Type.Object({
    username: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 100 }),
    email: type_provider_typebox_1.Type.String({ format: "email", maxLength: 100 }),
    password: type_provider_typebox_1.Type.String({ minLength: 8, maxLength: 255 }),
});
exports.updateUserBodySchema = type_provider_typebox_1.Type.Object({
    id: type_provider_typebox_1.Type.String({ format: "uuid" }),
    username: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 100 })),
    email: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ format: "email", maxLength: 100 })),
    password: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Union([type_provider_typebox_1.Type.String({ minLength: 8, maxLength: 255 }), type_provider_typebox_1.Type.Null()])),
    role: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Integer()),
}, { minProperties: 2 });
