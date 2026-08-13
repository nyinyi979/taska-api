"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentsRelations = exports.commentsRelations = exports.subtasksRelations = exports.taskLabelsRelations = exports.taskAssigneesRelations = exports.tasksRelations = exports.labelsRelations = exports.projectMembersRelations = exports.projectsRelations = exports.activitiesTable = exports.notificationsTable = exports.attachmentsTable = exports.commentsTable = exports.subtasksTable = exports.taskLabelsTable = exports.taskAssigneesTable = exports.tasksTable = exports.labelsTable = exports.projectMembersTable = exports.projectsTable = exports.taskPriority = exports.taskStatus = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const user_1 = require("./user");
exports.taskStatus = (0, pg_core_1.pgEnum)("task_status", [
    "todo",
    "in_progress",
    "in_review",
    "done",
]);
exports.taskPriority = (0, pg_core_1.pgEnum)("task_priority", [
    "low",
    "medium",
    "high",
    "urgent",
]);
exports.projectsTable = (0, pg_core_1.pgTable)("projects", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)({ length: 120 }).notNull(),
    description: (0, pg_core_1.text)().notNull().default(""),
    color: (0, pg_core_1.varchar)({ length: 20 }).notNull().default("#7c3aed"),
    createdBy: (0, pg_core_1.uuid)("created_by")
        .notNull()
        .references(() => user_1.usersTable.id),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.projectMembersTable = (0, pg_core_1.pgTable)("project_members", {
    projectId: (0, pg_core_1.uuid)("project_id")
        .notNull()
        .references(() => exports.projectsTable.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => user_1.usersTable.id, { onDelete: "cascade" }),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.projectId, table.userId] })]);
exports.labelsTable = (0, pg_core_1.pgTable)("labels", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    projectId: (0, pg_core_1.uuid)("project_id")
        .notNull()
        .references(() => exports.projectsTable.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.varchar)({ length: 60 }).notNull(),
    color: (0, pg_core_1.varchar)({ length: 20 }).notNull().default("#64748b"),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("labels_project_name_idx").on(table.projectId, table.name),
]);
exports.tasksTable = (0, pg_core_1.pgTable)("tasks", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    projectId: (0, pg_core_1.uuid)("project_id")
        .notNull()
        .references(() => exports.projectsTable.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)({ length: 240 }).notNull(),
    description: (0, pg_core_1.text)().notNull().default(""),
    status: (0, exports.taskStatus)().notNull().default("todo"),
    priority: (0, exports.taskPriority)().notNull().default("medium"),
    dueDate: (0, pg_core_1.timestamp)("due_date", { withTimezone: true }),
    createdBy: (0, pg_core_1.uuid)("created_by")
        .notNull()
        .references(() => user_1.usersTable.id),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("tasks_project_idx").on(table.projectId),
    (0, pg_core_1.index)("tasks_status_idx").on(table.status),
    (0, pg_core_1.index)("tasks_due_date_idx").on(table.dueDate),
]);
exports.taskAssigneesTable = (0, pg_core_1.pgTable)("task_assignees", {
    taskId: (0, pg_core_1.uuid)("task_id")
        .notNull()
        .references(() => exports.tasksTable.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => user_1.usersTable.id, { onDelete: "cascade" }),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.taskId, table.userId] })]);
exports.taskLabelsTable = (0, pg_core_1.pgTable)("task_labels", {
    taskId: (0, pg_core_1.uuid)("task_id")
        .notNull()
        .references(() => exports.tasksTable.id, { onDelete: "cascade" }),
    labelId: (0, pg_core_1.uuid)("label_id")
        .notNull()
        .references(() => exports.labelsTable.id, { onDelete: "cascade" }),
}, (table) => [(0, pg_core_1.primaryKey)({ columns: [table.taskId, table.labelId] })]);
exports.subtasksTable = (0, pg_core_1.pgTable)("subtasks", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    taskId: (0, pg_core_1.uuid)("task_id")
        .notNull()
        .references(() => exports.tasksTable.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)({ length: 240 }).notNull(),
    done: (0, pg_core_1.boolean)().notNull().default(false),
    assigneeId: (0, pg_core_1.uuid)("assignee_id").references(() => user_1.usersTable.id, {
        onDelete: "set null",
    }),
    dueDate: (0, pg_core_1.timestamp)("due_date", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.commentsTable = (0, pg_core_1.pgTable)("comments", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    taskId: (0, pg_core_1.uuid)("task_id")
        .notNull()
        .references(() => exports.tasksTable.id, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.uuid)("author_id")
        .notNull()
        .references(() => user_1.usersTable.id),
    text: (0, pg_core_1.text)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.attachmentsTable = (0, pg_core_1.pgTable)("attachments", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    taskId: (0, pg_core_1.uuid)("task_id")
        .notNull()
        .references(() => exports.tasksTable.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    url: (0, pg_core_1.varchar)({ length: 2048 }).notNull(),
    size: (0, pg_core_1.integer)().notNull(),
    uploadedBy: (0, pg_core_1.uuid)("uploaded_by")
        .notNull()
        .references(() => user_1.usersTable.id),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.notificationsTable = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => user_1.usersTable.id, { onDelete: "cascade" }),
    actorId: (0, pg_core_1.uuid)("actor_id")
        .notNull()
        .references(() => user_1.usersTable.id),
    type: (0, pg_core_1.varchar)({ length: 30 }).notNull(),
    text: (0, pg_core_1.varchar)({ length: 240 }).notNull(),
    projectId: (0, pg_core_1.uuid)("project_id")
        .notNull()
        .references(() => exports.projectsTable.id, { onDelete: "cascade" }),
    taskId: (0, pg_core_1.uuid)("task_id").references(() => exports.tasksTable.id, {
        onDelete: "cascade",
    }),
    read: (0, pg_core_1.boolean)().notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("notifications_user_idx").on(table.userId, table.createdAt),
]);
exports.activitiesTable = (0, pg_core_1.pgTable)("activities", {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    actorId: (0, pg_core_1.uuid)("actor_id")
        .notNull()
        .references(() => user_1.usersTable.id),
    text: (0, pg_core_1.varchar)({ length: 300 }).notNull(),
    projectId: (0, pg_core_1.uuid)("project_id")
        .notNull()
        .references(() => exports.projectsTable.id, { onDelete: "cascade" }),
    taskId: (0, pg_core_1.uuid)("task_id").references(() => exports.tasksTable.id, {
        onDelete: "cascade",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("activities_project_idx").on(table.projectId, table.createdAt),
]);
exports.projectsRelations = (0, drizzle_orm_1.relations)(exports.projectsTable, ({ many, one }) => ({
    creator: one(user_1.usersTable, {
        fields: [exports.projectsTable.createdBy],
        references: [user_1.usersTable.id],
    }),
    members: many(exports.projectMembersTable),
    labels: many(exports.labelsTable),
    tasks: many(exports.tasksTable),
}));
exports.projectMembersRelations = (0, drizzle_orm_1.relations)(exports.projectMembersTable, ({ one }) => ({
    project: one(exports.projectsTable, {
        fields: [exports.projectMembersTable.projectId],
        references: [exports.projectsTable.id],
    }),
    user: one(user_1.usersTable, {
        fields: [exports.projectMembersTable.userId],
        references: [user_1.usersTable.id],
    }),
}));
exports.labelsRelations = (0, drizzle_orm_1.relations)(exports.labelsTable, ({ one, many }) => ({
    project: one(exports.projectsTable, {
        fields: [exports.labelsTable.projectId],
        references: [exports.projectsTable.id],
    }),
    tasks: many(exports.taskLabelsTable),
}));
exports.tasksRelations = (0, drizzle_orm_1.relations)(exports.tasksTable, ({ one, many }) => ({
    project: one(exports.projectsTable, {
        fields: [exports.tasksTable.projectId],
        references: [exports.projectsTable.id],
    }),
    creator: one(user_1.usersTable, {
        fields: [exports.tasksTable.createdBy],
        references: [user_1.usersTable.id],
    }),
    assignees: many(exports.taskAssigneesTable),
    labels: many(exports.taskLabelsTable),
    subtasks: many(exports.subtasksTable),
    comments: many(exports.commentsTable),
    attachments: many(exports.attachmentsTable),
}));
exports.taskAssigneesRelations = (0, drizzle_orm_1.relations)(exports.taskAssigneesTable, ({ one }) => ({
    task: one(exports.tasksTable, {
        fields: [exports.taskAssigneesTable.taskId],
        references: [exports.tasksTable.id],
    }),
    user: one(user_1.usersTable, {
        fields: [exports.taskAssigneesTable.userId],
        references: [user_1.usersTable.id],
    }),
}));
exports.taskLabelsRelations = (0, drizzle_orm_1.relations)(exports.taskLabelsTable, ({ one }) => ({
    task: one(exports.tasksTable, {
        fields: [exports.taskLabelsTable.taskId],
        references: [exports.tasksTable.id],
    }),
    label: one(exports.labelsTable, {
        fields: [exports.taskLabelsTable.labelId],
        references: [exports.labelsTable.id],
    }),
}));
exports.subtasksRelations = (0, drizzle_orm_1.relations)(exports.subtasksTable, ({ one }) => ({
    task: one(exports.tasksTable, {
        fields: [exports.subtasksTable.taskId],
        references: [exports.tasksTable.id],
    }),
    assignee: one(user_1.usersTable, {
        fields: [exports.subtasksTable.assigneeId],
        references: [user_1.usersTable.id],
    }),
}));
exports.commentsRelations = (0, drizzle_orm_1.relations)(exports.commentsTable, ({ one }) => ({
    task: one(exports.tasksTable, {
        fields: [exports.commentsTable.taskId],
        references: [exports.tasksTable.id],
    }),
    author: one(user_1.usersTable, {
        fields: [exports.commentsTable.authorId],
        references: [user_1.usersTable.id],
    }),
}));
exports.attachmentsRelations = (0, drizzle_orm_1.relations)(exports.attachmentsTable, ({ one }) => ({
    task: one(exports.tasksTable, {
        fields: [exports.attachmentsTable.taskId],
        references: [exports.tasksTable.id],
    }),
    uploader: one(user_1.usersTable, {
        fields: [exports.attachmentsTable.uploadedBy],
        references: [user_1.usersTable.id],
    }),
}));
