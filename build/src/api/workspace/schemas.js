"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamsSchema = exports.updateSubtaskBodySchema = exports.createSubtaskBodySchema = exports.createAttachmentBodySchema = exports.createCommentBodySchema = exports.updateTaskBodySchema = exports.createTaskBodySchema = exports.updateLabelBodySchema = exports.createLabelBodySchema = exports.addProjectMemberBodySchema = exports.updateProjectBodySchema = exports.createProjectBodySchema = exports.prioritySchema = exports.statusSchema = void 0;
const type_provider_typebox_1 = require("@fastify/type-provider-typebox");
const schemas_1 = require("../schemas");
Object.defineProperty(exports, "idParamsSchema", { enumerable: true, get: function () { return schemas_1.idParamsSchema; } });
const colorSchema = type_provider_typebox_1.Type.String({ pattern: "^#[0-9a-fA-F]{6}$" });
const nullableDateSchema = type_provider_typebox_1.Type.Union([
    type_provider_typebox_1.Type.String({ format: "date-time" }),
    type_provider_typebox_1.Type.Null(),
]);
exports.statusSchema = type_provider_typebox_1.Type.Union([
    type_provider_typebox_1.Type.Literal("todo"),
    type_provider_typebox_1.Type.Literal("in_progress"),
    type_provider_typebox_1.Type.Literal("in_review"),
    type_provider_typebox_1.Type.Literal("done"),
]);
exports.prioritySchema = type_provider_typebox_1.Type.Union([
    type_provider_typebox_1.Type.Literal("low"),
    type_provider_typebox_1.Type.Literal("medium"),
    type_provider_typebox_1.Type.Literal("high"),
    type_provider_typebox_1.Type.Literal("urgent"),
]);
exports.createProjectBodySchema = type_provider_typebox_1.Type.Object({
    name: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 120 }),
    description: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ maxLength: 5000 })),
    color: type_provider_typebox_1.Type.Optional(colorSchema),
    memberIds: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Array(schemas_1.uuidSchema, { uniqueItems: true })),
    memberEmails: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Array(type_provider_typebox_1.Type.String({ format: "email", maxLength: 100 }), {
        uniqueItems: true,
    })),
});
exports.updateProjectBodySchema = type_provider_typebox_1.Type.Partial(exports.createProjectBodySchema, {
    minProperties: 1,
});
exports.addProjectMemberBodySchema = type_provider_typebox_1.Type.Object({
    email: type_provider_typebox_1.Type.String({ format: "email", maxLength: 100 }),
});
exports.createLabelBodySchema = type_provider_typebox_1.Type.Object({
    projectId: schemas_1.uuidSchema,
    name: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 60 }),
    color: type_provider_typebox_1.Type.Optional(colorSchema),
});
exports.updateLabelBodySchema = type_provider_typebox_1.Type.Object({
    name: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 60 })),
    color: type_provider_typebox_1.Type.Optional(colorSchema),
}, { minProperties: 1 });
exports.createTaskBodySchema = type_provider_typebox_1.Type.Object({
    projectId: schemas_1.uuidSchema,
    title: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 240 }),
    description: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ maxLength: 20000 })),
    status: type_provider_typebox_1.Type.Optional(exports.statusSchema),
    priority: type_provider_typebox_1.Type.Optional(exports.prioritySchema),
    dueDate: type_provider_typebox_1.Type.Optional(nullableDateSchema),
    assigneeIds: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Array(schemas_1.uuidSchema, { uniqueItems: true })),
    labelIds: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Array(schemas_1.uuidSchema, { uniqueItems: true })),
});
exports.updateTaskBodySchema = type_provider_typebox_1.Type.Object({
    title: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 240 })),
    description: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ maxLength: 20000 })),
    status: type_provider_typebox_1.Type.Optional(exports.statusSchema),
    priority: type_provider_typebox_1.Type.Optional(exports.prioritySchema),
    dueDate: type_provider_typebox_1.Type.Optional(nullableDateSchema),
    assigneeIds: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Array(schemas_1.uuidSchema, { uniqueItems: true })),
    labelIds: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Array(schemas_1.uuidSchema, { uniqueItems: true })),
}, { minProperties: 1 });
exports.createCommentBodySchema = type_provider_typebox_1.Type.Object({
    text: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 10000 }),
});
exports.createAttachmentBodySchema = type_provider_typebox_1.Type.Object({
    name: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 255 }),
    url: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 2048 }),
    size: type_provider_typebox_1.Type.Integer({ minimum: 0, maximum: 5 * 1024 * 1024 }),
});
exports.createSubtaskBodySchema = type_provider_typebox_1.Type.Object({
    title: type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 240 }),
    assigneeId: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Union([schemas_1.uuidSchema, type_provider_typebox_1.Type.Null()])),
    dueDate: type_provider_typebox_1.Type.Optional(nullableDateSchema),
});
exports.updateSubtaskBodySchema = type_provider_typebox_1.Type.Object({
    title: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.String({ minLength: 1, maxLength: 240 })),
    done: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Boolean()),
    assigneeId: type_provider_typebox_1.Type.Optional(type_provider_typebox_1.Type.Union([schemas_1.uuidSchema, type_provider_typebox_1.Type.Null()])),
    dueDate: type_provider_typebox_1.Type.Optional(nullableDateSchema),
}, { minProperties: 1 });
