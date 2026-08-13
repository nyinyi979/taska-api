import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import db from "../../db";
import { usersTable } from "../../db/user";
import {
  activitiesTable,
  attachmentsTable,
  commentsTable,
  labelsTable,
  notificationsTable,
  projectMembersTable,
  projectsTable,
  subtasksTable,
  taskAssigneesTable,
  taskLabelsTable,
  tasksTable,
} from "../../db/workspace";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors";
import { removeFile } from "../../utils/file";
import type {
  AddProjectMemberBody,
  CreateAttachmentBody,
  CreateCommentBody,
  CreateLabelBody,
  CreateProjectBody,
  CreateSubtaskBody,
  CreateTaskBody,
  UpdateLabelBody,
  UpdateProjectBody,
  UpdateSubtaskBody,
  UpdateTaskBody,
} from "./schemas";
import { publishNotificationEvent } from "./events";

const toIso = (value: Date | null) => value?.toISOString() ?? null;
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const ensureProjectAccess = async (userId: string, projectId: string) => {
  const membership = await db.query.projectMembersTable.findFirst({
    where: and(
      eq(projectMembersTable.projectId, projectId),
      eq(projectMembersTable.userId, userId),
    ),
  });
  if (!membership)
    throw new ForbiddenError("You are not a member of this project.");
};

const getTaskProjectId = async (taskId: string) => {
  const task = await db.query.tasksTable.findFirst({
    where: eq(tasksTable.id, taskId),
    columns: { projectId: true },
  });
  if (!task) throw new NotFoundError("Task not found.");
  return task.projectId;
};

const logActivity = async (
  actorId: string,
  projectId: string,
  text: string,
  taskId?: string,
) => {
  await db.insert(activitiesTable).values({ actorId, projectId, taskId, text });
};

const getProjectIds = async (userId: string) => {
  const memberships = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, userId));
  return memberships.map((item) => item.projectId);
};

const serializeMember = (member: {
  id: string;
  name: string;
  email: string;
  role: number;
  avatarColor: string;
  joinedAt: Date;
}) => ({
  ...member,
  role: member.role === 1 ? ("Admin" as const) : ("Member" as const),
  initials: initials(member.name),
  joinedAt: toIso(member.joinedAt),
});

export const getWorkspaceProfile = async (userId: string) => {
  const current = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    columns: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarColor: true,
      createdAt: true,
    },
  });
  if (!current) throw new NotFoundError("User not found.");
  return serializeMember({
    id: current.id,
    name: current.username,
    email: current.email,
    role: current.role,
    avatarColor: current.avatarColor,
    joinedAt: current.createdAt,
  });
};

export const getWorkspaceProjects = async (userId: string) => {
  const projectIds = await getProjectIds(userId);
  if (projectIds.length === 0) {
    return {
      members: [await getWorkspaceProfile(userId)],
      projects: [],
      labels: [],
    };
  }

  const [projects, projectMembers, labels] = await Promise.all([
    db
      .select()
      .from(projectsTable)
      .where(inArray(projectsTable.id, projectIds))
      .orderBy(asc(projectsTable.name)),
    db
      .select()
      .from(projectMembersTable)
      .where(inArray(projectMembersTable.projectId, projectIds)),
    db
      .select()
      .from(labelsTable)
      .where(inArray(labelsTable.projectId, projectIds))
      .orderBy(asc(labelsTable.name)),
  ]);
  const memberIds = [...new Set(projectMembers.map((item) => item.userId))];
  const directory = await db
    .select({
      id: usersTable.id,
      name: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      avatarColor: usersTable.avatarColor,
      joinedAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, memberIds))
    .orderBy(asc(usersTable.username));
  return {
    members: directory.map(serializeMember),
    projects: projects.map((project) => ({
      ...project,
      members: projectMembers
        .filter((item) => item.projectId === project.id)
        .map((item) => item.userId),
      createdAt: toIso(project.createdAt),
      updatedAt: toIso(project.updatedAt),
    })),
    labels,
  };
};

export const getWorkspaceTasks = async (userId: string) => {
  const projectIds = await getProjectIds(userId);
  if (projectIds.length === 0) return [];
  const baseTasks = await db
    .select()
    .from(tasksTable)
    .where(inArray(tasksTable.projectId, projectIds))
    .orderBy(desc(tasksTable.updatedAt));
  if (baseTasks.length === 0) return [];
  const taskIds = baseTasks.map((task) => task.id);
  const [tasks, assignees, taskLabels, subtasks, comments, attachments] =
    await Promise.all([
      Promise.resolve(baseTasks),
      db
        .select()
        .from(taskAssigneesTable)
        .where(inArray(taskAssigneesTable.taskId, taskIds)),
      db
        .select()
        .from(taskLabelsTable)
        .where(inArray(taskLabelsTable.taskId, taskIds)),
      db
        .select()
        .from(subtasksTable)
        .where(inArray(subtasksTable.taskId, taskIds))
        .orderBy(asc(subtasksTable.createdAt)),
      db
        .select()
        .from(commentsTable)
        .where(inArray(commentsTable.taskId, taskIds))
        .orderBy(asc(commentsTable.createdAt)),
      db
        .select()
        .from(attachmentsTable)
        .where(inArray(attachmentsTable.taskId, taskIds))
        .orderBy(asc(attachmentsTable.createdAt)),
    ]);
  return tasks.map((task) => {
    const taskComments = comments.filter((item) => item.taskId === task.id);
    return {
      ...task,
      dueDate: toIso(task.dueDate),
      createdAt: toIso(task.createdAt),
      updatedAt: toIso(task.updatedAt),
      assignees: assignees
        .filter((item) => item.taskId === task.id)
        .map((item) => item.userId),
      labels: taskLabels
        .filter((item) => item.taskId === task.id)
        .map((item) => item.labelId),
      subtasks: subtasks
        .filter((item) => item.taskId === task.id)
        .map((item) => ({
          ...item,
          dueDate: toIso(item.dueDate),
          createdAt: toIso(item.createdAt),
        })),
      comments: taskComments.map((item) => ({
        ...item,
        createdAt: toIso(item.createdAt),
      })),
      attachments: attachments
        .filter((item) => item.taskId === task.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
          size: formatFileSize(item.size),
          uploadedAt: toIso(item.createdAt),
        })),
      commentCount: taskComments.length,
      attachmentCount: attachments.filter((item) => item.taskId === task.id)
        .length,
    };
  });
};

export const getWorkspaceNotifications = async (userId: string) =>
  (
    await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(100)
  ).map((item) => ({ ...item, createdAt: toIso(item.createdAt) }));

export const getNotificationsAfter = async (userId: string, after: Date) =>
  db
    .select()
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, userId),
        gt(notificationsTable.createdAt, after),
      ),
    )
    .orderBy(asc(notificationsTable.createdAt));

export const getWorkspaceActivities = async (userId: string) => {
  const projectIds = await getProjectIds(userId);
  if (projectIds.length === 0) return [];
  return (
    await db
      .select()
      .from(activitiesTable)
      .where(inArray(activitiesTable.projectId, projectIds))
      .orderBy(desc(activitiesTable.createdAt))
      .limit(100)
  ).map((item) => ({
    ...item,
    createdAt: toIso(item.createdAt),
  }));
};

export const getWorkspace = async (userId: string) => {
  const [currentUser, projectData, tasks, notifications, activities] =
    await Promise.all([
      getWorkspaceProfile(userId),
      getWorkspaceProjects(userId),
      getWorkspaceTasks(userId),
      getWorkspaceNotifications(userId),
      getWorkspaceActivities(userId),
    ]);
  return {
    currentUser,
    ...projectData,
    tasks,
    notifications,
    activities,
  };
};

const ensureProjectOwner = async (userId: string, projectId: string) => {
  const project = await db.query.projectsTable.findFirst({
    where: eq(projectsTable.id, projectId),
    columns: { createdBy: true },
  });
  if (!project) throw new NotFoundError("Project not found.");
  if (project.createdBy !== userId)
    throw new ForbiddenError("Only the project owner can manage members.");
};

const findUsersByEmail = async (emails: string[]) => {
  const normalized = [...new Set(emails.map((email) => email.toLowerCase()))];
  if (normalized.length === 0) return [];
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      avatarColor: usersTable.avatarColor,
      joinedAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(inArray(sql<string>`lower(${usersTable.email})`, normalized));
  const found = new Set(users.map((user) => user.email.toLowerCase()));
  const missing = normalized.filter((email) => !found.has(email));
  if (missing.length)
    throw new BadRequestError(
      `No registered Taska account was found for ${missing.join(", ")}.`,
    );
  return users;
};

const publishNotifications = (
  items: Array<{ userId: string } & Record<string, unknown>>,
) => {
  for (const item of items)
    publishNotificationEvent(item.userId, "notification", item);
};

export const createProject = async (
  userId: string,
  body: CreateProjectBody,
) => {
  const invitedUsers = await findUsersByEmail(body.memberEmails ?? []);
  const result = await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projectsTable)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() ?? "",
        color: body.color ?? "#7c3aed",
        createdBy: userId,
      })
      .returning();
    const memberIds = [
      ...new Set([
        userId,
        ...(body.memberIds ?? []),
        ...invitedUsers.map((user) => user.id),
      ]),
    ];
    await tx.insert(projectMembersTable).values(
      memberIds.map((memberId) => ({
        projectId: project.id,
        userId: memberId,
      })),
    );
    await tx.insert(labelsTable).values([
      { projectId: project.id, name: "Bug", color: "#ef4444" },
      { projectId: project.id, name: "Feature", color: "#7c3aed" },
      { projectId: project.id, name: "Improvement", color: "#0ea5e9" },
    ]);
    await tx.insert(activitiesTable).values({
      actorId: userId,
      projectId: project.id,
      text: `created project ${project.name}`,
    });
    const recipients = memberIds.filter((id) => id !== userId);
    const notifications = recipients.length
      ? await tx
          .insert(notificationsTable)
          .values(
            recipients.map((recipient) => ({
              userId: recipient,
              actorId: userId,
              type: "project_invitation",
              text: "invited you to",
              projectId: project.id,
            })),
          )
          .returning()
      : [];
    return { project, notifications };
  });
  publishNotifications(result.notifications);
  return result.project;
};

export const addProjectMember = async (
  userId: string,
  projectId: string,
  body: AddProjectMemberBody,
) => {
  await ensureProjectOwner(userId, projectId);
  const [member] = await findUsersByEmail([body.email]);
  const [membership] = await db
    .insert(projectMembersTable)
    .values({ projectId, userId: member.id })
    .onConflictDoNothing()
    .returning();
  if (membership) {
    const [notification] = await db
      .insert(notificationsTable)
      .values({
        userId: member.id,
        actorId: userId,
        type: "project_invitation",
        text: "invited you to",
        projectId,
      })
      .returning();
    publishNotifications([notification]);
    await logActivity(userId, projectId, `added ${member.name} to the project`);
  }
  return { member: serializeMember(member), added: Boolean(membership) };
};

export const updateProject = async (
  userId: string,
  id: string,
  body: UpdateProjectBody,
) => {
  await ensureProjectAccess(userId, id);
  if (body.memberIds || body.memberEmails) await ensureProjectOwner(userId, id);
  return db.transaction(async (tx) => {
    const { memberIds, memberEmails, ...fields } = body;
    const [project] = await tx
      .update(projectsTable)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning();
    if (!project) throw new NotFoundError("Project not found.");
    if (memberIds || memberEmails) {
      const invitedUsers = await findUsersByEmail(memberEmails ?? []);
      await tx
        .delete(projectMembersTable)
        .where(eq(projectMembersTable.projectId, id));
      await tx.insert(projectMembersTable).values(
        [
          ...new Set([
            userId,
            ...(memberIds ?? []),
            ...invitedUsers.map((user) => user.id),
          ]),
        ].map((memberId) => ({
          projectId: id,
          userId: memberId,
        })),
      );
    }
    return project;
  });
};

export const deleteProject = async (userId: string, id: string) => {
  await ensureProjectAccess(userId, id);
  const [project] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, id))
    .returning();
  if (!project) throw new NotFoundError("Project not found.");
  return project;
};

export const createLabel = async (userId: string, body: CreateLabelBody) => {
  await ensureProjectAccess(userId, body.projectId);
  const [label] = await db
    .insert(labelsTable)
    .values({ ...body, name: body.name.trim() })
    .returning();
  return label;
};
export const updateLabel = async (
  userId: string,
  id: string,
  body: UpdateLabelBody,
) => {
  const label = await db.query.labelsTable.findFirst({
    where: eq(labelsTable.id, id),
  });
  if (!label) throw new NotFoundError("Label not found.");
  await ensureProjectAccess(userId, label.projectId);
  const [updated] = await db
    .update(labelsTable)
    .set(body)
    .where(eq(labelsTable.id, id))
    .returning();
  return updated;
};
export const deleteLabel = async (userId: string, id: string) => {
  const label = await db.query.labelsTable.findFirst({
    where: eq(labelsTable.id, id),
  });
  if (!label) throw new NotFoundError("Label not found.");
  await ensureProjectAccess(userId, label.projectId);
  const [deleted] = await db
    .delete(labelsTable)
    .where(eq(labelsTable.id, id))
    .returning();
  return deleted;
};

const validateTaskRelations = async (
  projectId: string,
  assigneeIds: string[],
  labelIds: string[],
) => {
  if (assigneeIds.length) {
    const valid = await db
      .select()
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.projectId, projectId),
          inArray(projectMembersTable.userId, assigneeIds),
        ),
      );
    if (valid.length !== assigneeIds.length)
      throw new BadRequestError("Every assignee must be a project member.");
  }
  if (labelIds.length) {
    const valid = await db
      .select()
      .from(labelsTable)
      .where(
        and(
          eq(labelsTable.projectId, projectId),
          inArray(labelsTable.id, labelIds),
        ),
      );
    if (valid.length !== labelIds.length)
      throw new BadRequestError("Every label must belong to the project.");
  }
};

export const createTask = async (userId: string, body: CreateTaskBody) => {
  await ensureProjectAccess(userId, body.projectId);
  const assigneeIds = body.assigneeIds ?? [];
  const labelIds = body.labelIds ?? [];
  await validateTaskRelations(body.projectId, assigneeIds, labelIds);
  const result = await db.transaction(async (tx) => {
    const [task] = await tx
      .insert(tasksTable)
      .values({
        projectId: body.projectId,
        title: body.title.trim(),
        description: body.description?.trim() ?? "",
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdBy: userId,
      })
      .returning();
    if (assigneeIds.length)
      await tx.insert(taskAssigneesTable).values(
        assigneeIds.map((memberId) => ({
          taskId: task.id,
          userId: memberId,
        })),
      );
    if (labelIds.length)
      await tx
        .insert(taskLabelsTable)
        .values(labelIds.map((labelId) => ({ taskId: task.id, labelId })));
    await tx.insert(activitiesTable).values({
      actorId: userId,
      projectId: task.projectId,
      taskId: task.id,
      text: `created task ${task.title}`,
    });
    const recipients = assigneeIds.filter((id) => id !== userId);
    const notifications = recipients.length
      ? await tx
          .insert(notificationsTable)
          .values(
            recipients.map((recipient) => ({
              userId: recipient,
              actorId: userId,
              type: "assignment",
              text: "assigned you to",
              projectId: task.projectId,
              taskId: task.id,
            })),
          )
          .returning()
      : [];
    return { task, notifications };
  });
  publishNotifications(result.notifications);
  return result.task;
};

export const updateTask = async (
  userId: string,
  id: string,
  body: UpdateTaskBody,
) => {
  const projectId = await getTaskProjectId(id);
  await ensureProjectAccess(userId, projectId);
  const assigneeIds = body.assigneeIds;
  const labelIds = body.labelIds;
  const existingAssignees = await db
    .select({ userId: taskAssigneesTable.userId })
    .from(taskAssigneesTable)
    .where(eq(taskAssigneesTable.taskId, id));
  if (assigneeIds || labelIds)
    await validateTaskRelations(projectId, assigneeIds ?? [], labelIds ?? []);
  const result = await db.transaction(async (tx) => {
    const {
      assigneeIds: _assigneeIds,
      labelIds: _labelIds,
      dueDate,
      ...fields
    } = body;
    const [task] = await tx
      .update(tasksTable)
      .set({
        ...fields,
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, id))
      .returning();
    if (!task) throw new NotFoundError("Task not found.");
    if (assigneeIds) {
      await tx
        .delete(taskAssigneesTable)
        .where(eq(taskAssigneesTable.taskId, id));
      if (assigneeIds.length)
        await tx
          .insert(taskAssigneesTable)
          .values(
            assigneeIds.map((memberId) => ({ taskId: id, userId: memberId })),
          );
    }
    if (labelIds) {
      await tx.delete(taskLabelsTable).where(eq(taskLabelsTable.taskId, id));
      if (labelIds.length)
        await tx
          .insert(taskLabelsTable)
          .values(labelIds.map((labelId) => ({ taskId: id, labelId })));
    }
    await tx.insert(activitiesTable).values({
      actorId: userId,
      projectId,
      taskId: id,
      text: `updated task ${task.title}`,
    });
    const previousIds = new Set(existingAssignees.map((item) => item.userId));
    const assignmentRecipients = (assigneeIds ?? []).filter(
      (assigneeId) => assigneeId !== userId && !previousIds.has(assigneeId),
    );
    const assignmentRecipientIds = new Set(assignmentRecipients);
    const hasTaskUpdate = Object.keys(body).some(
      (field) => field !== "assigneeIds",
    );
    const updateRecipients = hasTaskUpdate
      ? (assigneeIds ?? [...previousIds]).filter(
          (assigneeId) =>
            assigneeId !== userId && !assignmentRecipientIds.has(assigneeId),
        )
      : [];
    const notificationValues = [
      ...assignmentRecipients.map((recipient) => ({
        userId: recipient,
        actorId: userId,
        type: "assignment",
        text: "assigned you to",
        projectId,
        taskId: id,
      })),
      ...updateRecipients.map((recipient) => ({
        userId: recipient,
        actorId: userId,
        type: "update",
        text: "updated",
        projectId,
        taskId: id,
      })),
    ];
    const notifications = notificationValues.length
      ? await tx
          .insert(notificationsTable)
          .values(notificationValues)
          .returning()
      : [];
    return { task, notifications };
  });
  publishNotifications(result.notifications);
  return result.task;
};

export const deleteTask = async (userId: string, id: string) => {
  const projectId = await getTaskProjectId(id);
  await ensureProjectAccess(userId, projectId);
  const [task] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, id))
    .returning();
  return task;
};

export const createComment = async (
  userId: string,
  taskId: string,
  body: CreateCommentBody,
) => {
  const projectId = await getTaskProjectId(taskId);
  await ensureProjectAccess(userId, projectId);
  const result = await db.transaction(async (tx) => {
    const [comment] = await tx
      .insert(commentsTable)
      .values({ taskId, authorId: userId, text: body.text.trim() })
      .returning();
    await tx.insert(activitiesTable).values({
      actorId: userId,
      projectId,
      taskId,
      text: "commented on a task",
    });
    const task = await tx.query.tasksTable.findFirst({
      where: eq(tasksTable.id, taskId),
      columns: { createdBy: true },
    });
    const assignees = await tx
      .select({ userId: taskAssigneesTable.userId })
      .from(taskAssigneesTable)
      .where(eq(taskAssigneesTable.taskId, taskId));
    const recipients = [
      ...new Set([task?.createdBy, ...assignees.map((item) => item.userId)]),
    ].filter((recipient): recipient is string =>
      Boolean(recipient && recipient !== userId),
    );
    const notifications = recipients.length
      ? await tx
          .insert(notificationsTable)
          .values(
            recipients.map((recipient) => ({
              userId: recipient,
              actorId: userId,
              type: "comment",
              text: "commented on",
              projectId,
              taskId,
            })),
          )
          .returning()
      : [];
    return { comment, notifications };
  });
  publishNotifications(result.notifications);
  return result.comment;
};

export const createAttachment = async (
  userId: string,
  taskId: string,
  body: CreateAttachmentBody,
) => {
  const projectId = await getTaskProjectId(taskId);
  await ensureProjectAccess(userId, projectId);
  const [attachment] = await db
    .insert(attachmentsTable)
    .values({ taskId, uploadedBy: userId, ...body })
    .returning();
  await logActivity(userId, projectId, `attached ${body.name}`, taskId);
  return attachment;
};

export const deleteAttachment = async (userId: string, id: string) => {
  const attachment = await db.query.attachmentsTable.findFirst({
    where: eq(attachmentsTable.id, id),
  });
  if (!attachment) throw new NotFoundError("Attachment not found.");
  const projectId = await getTaskProjectId(attachment.taskId);
  await ensureProjectAccess(userId, projectId);
  await removeFile(attachment.url);
  const [deleted] = await db
    .delete(attachmentsTable)
    .where(eq(attachmentsTable.id, id))
    .returning();
  return deleted;
};

export const createSubtask = async (
  userId: string,
  taskId: string,
  body: CreateSubtaskBody,
) => {
  const projectId = await getTaskProjectId(taskId);
  await ensureProjectAccess(userId, projectId);
  if (body.assigneeId)
    await validateTaskRelations(projectId, [body.assigneeId], []);
  const result = await db.transaction(async (tx) => {
    const [subtask] = await tx
      .insert(subtasksTable)
      .values({
        taskId,
        title: body.title.trim(),
        assigneeId: body.assigneeId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      })
      .returning();
    const notifications =
      body.assigneeId && body.assigneeId !== userId
        ? await tx
            .insert(notificationsTable)
            .values({
              userId: body.assigneeId,
              actorId: userId,
              type: "assignment",
              text: "assigned you a subtask in",
              projectId,
              taskId,
            })
            .returning()
        : [];
    return { subtask, notifications };
  });
  publishNotifications(result.notifications);
  return result.subtask;
};

export const updateSubtask = async (
  userId: string,
  id: string,
  body: UpdateSubtaskBody,
) => {
  const existing = await db.query.subtasksTable.findFirst({
    where: eq(subtasksTable.id, id),
  });
  if (!existing) throw new NotFoundError("Subtask not found.");
  const projectId = await getTaskProjectId(existing.taskId);
  await ensureProjectAccess(userId, projectId);
  if (body.assigneeId)
    await validateTaskRelations(projectId, [body.assigneeId], []);
  const { dueDate, ...fields } = body;
  const result = await db.transaction(async (tx) => {
    const [subtask] = await tx
      .update(subtasksTable)
      .set({
        ...fields,
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
      })
      .where(eq(subtasksTable.id, id))
      .returning();
    const notifications =
      body.assigneeId &&
      body.assigneeId !== userId &&
      body.assigneeId !== existing.assigneeId
        ? await tx
            .insert(notificationsTable)
            .values({
              userId: body.assigneeId,
              actorId: userId,
              type: "assignment",
              text: "assigned you a subtask in",
              projectId,
              taskId: existing.taskId,
            })
            .returning()
        : [];
    return { subtask, notifications };
  });
  publishNotifications(result.notifications);
  return result.subtask;
};

export const deleteSubtask = async (userId: string, id: string) => {
  const existing = await db.query.subtasksTable.findFirst({
    where: eq(subtasksTable.id, id),
  });
  if (!existing) throw new NotFoundError("Subtask not found.");
  const projectId = await getTaskProjectId(existing.taskId);
  await ensureProjectAccess(userId, projectId);
  const [subtask] = await db
    .delete(subtasksTable)
    .where(eq(subtasksTable.id, id))
    .returning();
  return subtask;
};

export const markNotification = async (userId: string, id: string) => {
  const [notification] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(
      and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)),
    )
    .returning();
  if (!notification) throw new NotFoundError("Notification not found.");
  return notification;
};
export const markAllNotifications = async (userId: string) =>
  db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, userId))
    .returning();
