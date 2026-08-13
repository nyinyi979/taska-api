import { Static, Type } from "@fastify/type-provider-typebox";
import { idParamsSchema, uuidSchema } from "../schemas";

const colorSchema = Type.String({ pattern: "^#[0-9a-fA-F]{6}$" });
const nullableDateSchema = Type.Union([
  Type.String({ format: "date-time" }),
  Type.Null(),
]);
export const statusSchema = Type.Union([
  Type.Literal("todo"),
  Type.Literal("in_progress"),
  Type.Literal("in_review"),
  Type.Literal("done"),
]);
export const prioritySchema = Type.Union([
  Type.Literal("low"),
  Type.Literal("medium"),
  Type.Literal("high"),
  Type.Literal("urgent"),
]);

export const createProjectBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 120 }),
  description: Type.Optional(Type.String({ maxLength: 5000 })),
  color: Type.Optional(colorSchema),
  memberIds: Type.Optional(Type.Array(uuidSchema, { uniqueItems: true })),
  memberEmails: Type.Optional(
    Type.Array(Type.String({ format: "email", maxLength: 100 }), {
      uniqueItems: true,
    }),
  ),
});
export const updateProjectBodySchema = Type.Partial(createProjectBodySchema, {
  minProperties: 1,
});

export const addProjectMemberBodySchema = Type.Object({
  email: Type.String({ format: "email", maxLength: 100 }),
});

export const createLabelBodySchema = Type.Object({
  projectId: uuidSchema,
  name: Type.String({ minLength: 1, maxLength: 60 }),
  color: Type.Optional(colorSchema),
});
export const updateLabelBodySchema = Type.Object(
  {
    name: Type.Optional(Type.String({ minLength: 1, maxLength: 60 })),
    color: Type.Optional(colorSchema),
  },
  { minProperties: 1 },
);

export const createTaskBodySchema = Type.Object({
  projectId: uuidSchema,
  title: Type.String({ minLength: 1, maxLength: 240 }),
  description: Type.Optional(Type.String({ maxLength: 20000 })),
  status: Type.Optional(statusSchema),
  priority: Type.Optional(prioritySchema),
  dueDate: Type.Optional(nullableDateSchema),
  assigneeIds: Type.Optional(Type.Array(uuidSchema, { uniqueItems: true })),
  labelIds: Type.Optional(Type.Array(uuidSchema, { uniqueItems: true })),
});
export const updateTaskBodySchema = Type.Object(
  {
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 240 })),
    description: Type.Optional(Type.String({ maxLength: 20000 })),
    status: Type.Optional(statusSchema),
    priority: Type.Optional(prioritySchema),
    dueDate: Type.Optional(nullableDateSchema),
    assigneeIds: Type.Optional(Type.Array(uuidSchema, { uniqueItems: true })),
    labelIds: Type.Optional(Type.Array(uuidSchema, { uniqueItems: true })),
  },
  { minProperties: 1 },
);

export const createCommentBodySchema = Type.Object({
  text: Type.String({ minLength: 1, maxLength: 10000 }),
});
export const createAttachmentBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  url: Type.String({ minLength: 1, maxLength: 2048 }),
  size: Type.Integer({ minimum: 0, maximum: 5 * 1024 * 1024 }),
});
export const createSubtaskBodySchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 240 }),
  assigneeId: Type.Optional(Type.Union([uuidSchema, Type.Null()])),
  dueDate: Type.Optional(nullableDateSchema),
});
export const updateSubtaskBodySchema = Type.Object(
  {
    title: Type.Optional(Type.String({ minLength: 1, maxLength: 240 })),
    done: Type.Optional(Type.Boolean()),
    assigneeId: Type.Optional(Type.Union([uuidSchema, Type.Null()])),
    dueDate: Type.Optional(nullableDateSchema),
  },
  { minProperties: 1 },
);

export { idParamsSchema };
export type CreateProjectBody = Static<typeof createProjectBodySchema>;
export type UpdateProjectBody = Static<typeof updateProjectBodySchema>;
export type AddProjectMemberBody = Static<typeof addProjectMemberBodySchema>;
export type CreateLabelBody = Static<typeof createLabelBodySchema>;
export type UpdateLabelBody = Static<typeof updateLabelBodySchema>;
export type CreateTaskBody = Static<typeof createTaskBodySchema>;
export type UpdateTaskBody = Static<typeof updateTaskBodySchema>;
export type CreateCommentBody = Static<typeof createCommentBodySchema>;
export type CreateAttachmentBody = Static<typeof createAttachmentBodySchema>;
export type CreateSubtaskBody = Static<typeof createSubtaskBodySchema>;
export type UpdateSubtaskBody = Static<typeof updateSubtaskBodySchema>;
