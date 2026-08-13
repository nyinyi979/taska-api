import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const taskStatus = pgEnum("task_status", [
  "todo",
  "in_progress",
  "in_review",
  "done",
]);
export const taskPriority = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const projectsTable = pgTable("projects", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 120 }).notNull(),
  description: text().notNull().default(""),
  color: varchar({ length: 20 }).notNull().default("#7c3aed"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectMembersTable = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.userId] })],
);

export const labelsTable = pgTable(
  "labels",
  {
    id: uuid().defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 60 }).notNull(),
    color: varchar({ length: 20 }).notNull().default("#64748b"),
  },
  (table) => [
    uniqueIndex("labels_project_name_idx").on(table.projectId, table.name),
  ],
);

export const tasksTable = pgTable(
  "tasks",
  {
    id: uuid().defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    title: varchar({ length: 240 }).notNull(),
    description: text().notNull().default(""),
    status: taskStatus().notNull().default("todo"),
    priority: taskPriority().notNull().default("medium"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => usersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tasks_project_idx").on(table.projectId),
    index("tasks_status_idx").on(table.status),
    index("tasks_due_date_idx").on(table.dueDate),
  ],
);

export const taskAssigneesTable = pgTable(
  "task_assignees",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.userId] })],
);

export const taskLabelsTable = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labelsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.labelId] })],
);

export const subtasksTable = pgTable("subtasks", {
  id: uuid().defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 240 }).notNull(),
  done: boolean().notNull().default(false),
  assigneeId: uuid("assignee_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commentsTable = pgTable("comments", {
  id: uuid().defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id),
  text: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const attachmentsTable = pgTable("attachments", {
  id: uuid().defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  url: varchar({ length: 2048 }).notNull(),
  size: integer().notNull(),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => usersTable.id),
    type: varchar({ length: 30 }).notNull(),
    text: varchar({ length: 240 }).notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasksTable.id, {
      onDelete: "cascade",
    }),
    read: boolean().notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId, table.createdAt),
  ],
);

export const activitiesTable = pgTable(
  "activities",
  {
    id: uuid().defaultRandom().primaryKey(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => usersTable.id),
    text: varchar({ length: 300 }).notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasksTable.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activities_project_idx").on(table.projectId, table.createdAt),
  ],
);

export const projectsRelations = relations(projectsTable, ({ many, one }) => ({
  creator: one(usersTable, {
    fields: [projectsTable.createdBy],
    references: [usersTable.id],
  }),
  members: many(projectMembersTable),
  labels: many(labelsTable),
  tasks: many(tasksTable),
}));
export const projectMembersRelations = relations(
  projectMembersTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [projectMembersTable.projectId],
      references: [projectsTable.id],
    }),
    user: one(usersTable, {
      fields: [projectMembersTable.userId],
      references: [usersTable.id],
    }),
  }),
);
export const labelsRelations = relations(labelsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [labelsTable.projectId],
    references: [projectsTable.id],
  }),
  tasks: many(taskLabelsTable),
}));
export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.projectId],
    references: [projectsTable.id],
  }),
  creator: one(usersTable, {
    fields: [tasksTable.createdBy],
    references: [usersTable.id],
  }),
  assignees: many(taskAssigneesTable),
  labels: many(taskLabelsTable),
  subtasks: many(subtasksTable),
  comments: many(commentsTable),
  attachments: many(attachmentsTable),
}));
export const taskAssigneesRelations = relations(
  taskAssigneesTable,
  ({ one }) => ({
    task: one(tasksTable, {
      fields: [taskAssigneesTable.taskId],
      references: [tasksTable.id],
    }),
    user: one(usersTable, {
      fields: [taskAssigneesTable.userId],
      references: [usersTable.id],
    }),
  }),
);
export const taskLabelsRelations = relations(taskLabelsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskLabelsTable.taskId],
    references: [tasksTable.id],
  }),
  label: one(labelsTable, {
    fields: [taskLabelsTable.labelId],
    references: [labelsTable.id],
  }),
}));
export const subtasksRelations = relations(subtasksTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [subtasksTable.taskId],
    references: [tasksTable.id],
  }),
  assignee: one(usersTable, {
    fields: [subtasksTable.assigneeId],
    references: [usersTable.id],
  }),
}));
export const commentsRelations = relations(commentsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [commentsTable.taskId],
    references: [tasksTable.id],
  }),
  author: one(usersTable, {
    fields: [commentsTable.authorId],
    references: [usersTable.id],
  }),
}));
export const attachmentsRelations = relations(attachmentsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [attachmentsTable.taskId],
    references: [tasksTable.id],
  }),
  uploader: one(usersTable, {
    fields: [attachmentsTable.uploadedBy],
    references: [usersTable.id],
  }),
}));
