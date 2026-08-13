"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotifications = exports.markNotification = exports.deleteSubtask = exports.updateSubtask = exports.createSubtask = exports.deleteAttachment = exports.createAttachment = exports.createComment = exports.deleteTask = exports.updateTask = exports.createTask = exports.deleteLabel = exports.updateLabel = exports.createLabel = exports.deleteProject = exports.updateProject = exports.addProjectMember = exports.createProject = exports.getWorkspace = exports.getWorkspaceActivities = exports.getNotificationsAfter = exports.getWorkspaceNotifications = exports.getWorkspaceTasks = exports.getWorkspaceProjects = exports.getWorkspaceProfile = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../../db"));
const user_1 = require("../../db/user");
const workspace_1 = require("../../db/workspace");
const errors_1 = require("../../utils/errors");
const file_1 = require("../../utils/file");
const events_1 = require("./events");
const toIso = (value) => { var _a; return (_a = value === null || value === void 0 ? void 0 : value.toISOString()) !== null && _a !== void 0 ? _a : null; };
const formatFileSize = (bytes) => {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const initials = (name) => name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const ensureProjectAccess = async (userId, projectId) => {
    const membership = await db_1.default.query.projectMembersTable.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(workspace_1.projectMembersTable.projectId, projectId), (0, drizzle_orm_1.eq)(workspace_1.projectMembersTable.userId, userId)),
    });
    if (!membership)
        throw new errors_1.ForbiddenError("You are not a member of this project.");
};
const getTaskProjectId = async (taskId) => {
    const task = await db_1.default.query.tasksTable.findFirst({
        where: (0, drizzle_orm_1.eq)(workspace_1.tasksTable.id, taskId),
        columns: { projectId: true },
    });
    if (!task)
        throw new errors_1.NotFoundError("Task not found.");
    return task.projectId;
};
const logActivity = async (actorId, projectId, text, taskId) => {
    await db_1.default.insert(workspace_1.activitiesTable).values({ actorId, projectId, taskId, text });
};
const getProjectIds = async (userId) => {
    const memberships = await db_1.default
        .select({ projectId: workspace_1.projectMembersTable.projectId })
        .from(workspace_1.projectMembersTable)
        .where((0, drizzle_orm_1.eq)(workspace_1.projectMembersTable.userId, userId));
    return memberships.map((item) => item.projectId);
};
const serializeMember = (member) => ({
    ...member,
    role: member.role === 1 ? "Admin" : "Member",
    initials: initials(member.name),
    joinedAt: toIso(member.joinedAt),
});
const getWorkspaceProfile = async (userId) => {
    const current = await db_1.default.query.usersTable.findFirst({
        where: (0, drizzle_orm_1.eq)(user_1.usersTable.id, userId),
        columns: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatarColor: true,
            createdAt: true,
        },
    });
    if (!current)
        throw new errors_1.NotFoundError("User not found.");
    return serializeMember({
        id: current.id,
        name: current.username,
        email: current.email,
        role: current.role,
        avatarColor: current.avatarColor,
        joinedAt: current.createdAt,
    });
};
exports.getWorkspaceProfile = getWorkspaceProfile;
const getWorkspaceProjects = async (userId) => {
    const projectIds = await getProjectIds(userId);
    if (projectIds.length === 0) {
        return {
            members: [await (0, exports.getWorkspaceProfile)(userId)],
            projects: [],
            labels: [],
        };
    }
    const [projects, projectMembers, labels] = await Promise.all([
        db_1.default
            .select()
            .from(workspace_1.projectsTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.projectsTable.id, projectIds))
            .orderBy((0, drizzle_orm_1.asc)(workspace_1.projectsTable.name)),
        db_1.default
            .select()
            .from(workspace_1.projectMembersTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.projectMembersTable.projectId, projectIds)),
        db_1.default
            .select()
            .from(workspace_1.labelsTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.labelsTable.projectId, projectIds))
            .orderBy((0, drizzle_orm_1.asc)(workspace_1.labelsTable.name)),
    ]);
    const memberIds = [...new Set(projectMembers.map((item) => item.userId))];
    const directory = await db_1.default
        .select({
        id: user_1.usersTable.id,
        name: user_1.usersTable.username,
        email: user_1.usersTable.email,
        role: user_1.usersTable.role,
        avatarColor: user_1.usersTable.avatarColor,
        joinedAt: user_1.usersTable.createdAt,
    })
        .from(user_1.usersTable)
        .where((0, drizzle_orm_1.inArray)(user_1.usersTable.id, memberIds))
        .orderBy((0, drizzle_orm_1.asc)(user_1.usersTable.username));
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
exports.getWorkspaceProjects = getWorkspaceProjects;
const getWorkspaceTasks = async (userId) => {
    const projectIds = await getProjectIds(userId);
    if (projectIds.length === 0)
        return [];
    const baseTasks = await db_1.default
        .select()
        .from(workspace_1.tasksTable)
        .where((0, drizzle_orm_1.inArray)(workspace_1.tasksTable.projectId, projectIds))
        .orderBy((0, drizzle_orm_1.desc)(workspace_1.tasksTable.updatedAt));
    if (baseTasks.length === 0)
        return [];
    const taskIds = baseTasks.map((task) => task.id);
    const [tasks, assignees, taskLabels, subtasks, comments, attachments] = await Promise.all([
        Promise.resolve(baseTasks),
        db_1.default
            .select()
            .from(workspace_1.taskAssigneesTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.taskAssigneesTable.taskId, taskIds)),
        db_1.default
            .select()
            .from(workspace_1.taskLabelsTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.taskLabelsTable.taskId, taskIds)),
        db_1.default
            .select()
            .from(workspace_1.subtasksTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.subtasksTable.taskId, taskIds))
            .orderBy((0, drizzle_orm_1.asc)(workspace_1.subtasksTable.createdAt)),
        db_1.default
            .select()
            .from(workspace_1.commentsTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.commentsTable.taskId, taskIds))
            .orderBy((0, drizzle_orm_1.asc)(workspace_1.commentsTable.createdAt)),
        db_1.default
            .select()
            .from(workspace_1.attachmentsTable)
            .where((0, drizzle_orm_1.inArray)(workspace_1.attachmentsTable.taskId, taskIds))
            .orderBy((0, drizzle_orm_1.asc)(workspace_1.attachmentsTable.createdAt)),
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
exports.getWorkspaceTasks = getWorkspaceTasks;
const getWorkspaceNotifications = async (userId) => (await db_1.default
    .select()
    .from(workspace_1.notificationsTable)
    .where((0, drizzle_orm_1.eq)(workspace_1.notificationsTable.userId, userId))
    .orderBy((0, drizzle_orm_1.desc)(workspace_1.notificationsTable.createdAt))
    .limit(100)).map((item) => ({ ...item, createdAt: toIso(item.createdAt) }));
exports.getWorkspaceNotifications = getWorkspaceNotifications;
const getNotificationsAfter = async (userId, after) => db_1.default
    .select()
    .from(workspace_1.notificationsTable)
    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(workspace_1.notificationsTable.userId, userId), (0, drizzle_orm_1.gt)(workspace_1.notificationsTable.createdAt, after)))
    .orderBy((0, drizzle_orm_1.asc)(workspace_1.notificationsTable.createdAt));
exports.getNotificationsAfter = getNotificationsAfter;
const getWorkspaceActivities = async (userId) => {
    const projectIds = await getProjectIds(userId);
    if (projectIds.length === 0)
        return [];
    return (await db_1.default
        .select()
        .from(workspace_1.activitiesTable)
        .where((0, drizzle_orm_1.inArray)(workspace_1.activitiesTable.projectId, projectIds))
        .orderBy((0, drizzle_orm_1.desc)(workspace_1.activitiesTable.createdAt))
        .limit(100)).map((item) => ({
        ...item,
        createdAt: toIso(item.createdAt),
    }));
};
exports.getWorkspaceActivities = getWorkspaceActivities;
const getWorkspace = async (userId) => {
    const [currentUser, projectData, tasks, notifications, activities] = await Promise.all([
        (0, exports.getWorkspaceProfile)(userId),
        (0, exports.getWorkspaceProjects)(userId),
        (0, exports.getWorkspaceTasks)(userId),
        (0, exports.getWorkspaceNotifications)(userId),
        (0, exports.getWorkspaceActivities)(userId),
    ]);
    return {
        currentUser,
        ...projectData,
        tasks,
        notifications,
        activities,
    };
};
exports.getWorkspace = getWorkspace;
const ensureProjectOwner = async (userId, projectId) => {
    const project = await db_1.default.query.projectsTable.findFirst({
        where: (0, drizzle_orm_1.eq)(workspace_1.projectsTable.id, projectId),
        columns: { createdBy: true },
    });
    if (!project)
        throw new errors_1.NotFoundError("Project not found.");
    if (project.createdBy !== userId)
        throw new errors_1.ForbiddenError("Only the project owner can manage members.");
};
const findUsersByEmail = async (emails) => {
    const normalized = [...new Set(emails.map((email) => email.toLowerCase()))];
    if (normalized.length === 0)
        return [];
    const users = await db_1.default
        .select({
        id: user_1.usersTable.id,
        name: user_1.usersTable.username,
        email: user_1.usersTable.email,
        role: user_1.usersTable.role,
        avatarColor: user_1.usersTable.avatarColor,
        joinedAt: user_1.usersTable.createdAt,
    })
        .from(user_1.usersTable)
        .where((0, drizzle_orm_1.inArray)((0, drizzle_orm_1.sql) `lower(${user_1.usersTable.email})`, normalized));
    const found = new Set(users.map((user) => user.email.toLowerCase()));
    const missing = normalized.filter((email) => !found.has(email));
    if (missing.length)
        throw new errors_1.BadRequestError(`No registered Taska account was found for ${missing.join(", ")}.`);
    return users;
};
const publishNotifications = (items) => {
    for (const item of items)
        (0, events_1.publishNotificationEvent)(item.userId, "notification", item);
};
const createProject = async (userId, body) => {
    var _a;
    const invitedUsers = await findUsersByEmail((_a = body.memberEmails) !== null && _a !== void 0 ? _a : []);
    const result = await db_1.default.transaction(async (tx) => {
        var _a, _b, _c, _d;
        const [project] = await tx
            .insert(workspace_1.projectsTable)
            .values({
            name: body.name.trim(),
            description: (_b = (_a = body.description) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "",
            color: (_c = body.color) !== null && _c !== void 0 ? _c : "#7c3aed",
            createdBy: userId,
        })
            .returning();
        const memberIds = [
            ...new Set([
                userId,
                ...((_d = body.memberIds) !== null && _d !== void 0 ? _d : []),
                ...invitedUsers.map((user) => user.id),
            ]),
        ];
        await tx.insert(workspace_1.projectMembersTable).values(memberIds.map((memberId) => ({
            projectId: project.id,
            userId: memberId,
        })));
        await tx.insert(workspace_1.labelsTable).values([
            { projectId: project.id, name: "Bug", color: "#ef4444" },
            { projectId: project.id, name: "Feature", color: "#7c3aed" },
            { projectId: project.id, name: "Improvement", color: "#0ea5e9" },
        ]);
        await tx.insert(workspace_1.activitiesTable).values({
            actorId: userId,
            projectId: project.id,
            text: `created project ${project.name}`,
        });
        const recipients = memberIds.filter((id) => id !== userId);
        const notifications = recipients.length
            ? await tx
                .insert(workspace_1.notificationsTable)
                .values(recipients.map((recipient) => ({
                userId: recipient,
                actorId: userId,
                type: "project_invitation",
                text: "invited you to",
                projectId: project.id,
            })))
                .returning()
            : [];
        return { project, notifications };
    });
    publishNotifications(result.notifications);
    return result.project;
};
exports.createProject = createProject;
const addProjectMember = async (userId, projectId, body) => {
    await ensureProjectOwner(userId, projectId);
    const [member] = await findUsersByEmail([body.email]);
    const [membership] = await db_1.default
        .insert(workspace_1.projectMembersTable)
        .values({ projectId, userId: member.id })
        .onConflictDoNothing()
        .returning();
    if (membership) {
        const [notification] = await db_1.default
            .insert(workspace_1.notificationsTable)
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
exports.addProjectMember = addProjectMember;
const updateProject = async (userId, id, body) => {
    await ensureProjectAccess(userId, id);
    if (body.memberIds || body.memberEmails)
        await ensureProjectOwner(userId, id);
    return db_1.default.transaction(async (tx) => {
        const { memberIds, memberEmails, ...fields } = body;
        const [project] = await tx
            .update(workspace_1.projectsTable)
            .set({ ...fields, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(workspace_1.projectsTable.id, id))
            .returning();
        if (!project)
            throw new errors_1.NotFoundError("Project not found.");
        if (memberIds || memberEmails) {
            const invitedUsers = await findUsersByEmail(memberEmails !== null && memberEmails !== void 0 ? memberEmails : []);
            await tx
                .delete(workspace_1.projectMembersTable)
                .where((0, drizzle_orm_1.eq)(workspace_1.projectMembersTable.projectId, id));
            await tx.insert(workspace_1.projectMembersTable).values([
                ...new Set([
                    userId,
                    ...(memberIds !== null && memberIds !== void 0 ? memberIds : []),
                    ...invitedUsers.map((user) => user.id),
                ]),
            ].map((memberId) => ({
                projectId: id,
                userId: memberId,
            })));
        }
        return project;
    });
};
exports.updateProject = updateProject;
const deleteProject = async (userId, id) => {
    await ensureProjectAccess(userId, id);
    const [project] = await db_1.default
        .delete(workspace_1.projectsTable)
        .where((0, drizzle_orm_1.eq)(workspace_1.projectsTable.id, id))
        .returning();
    if (!project)
        throw new errors_1.NotFoundError("Project not found.");
    return project;
};
exports.deleteProject = deleteProject;
const createLabel = async (userId, body) => {
    await ensureProjectAccess(userId, body.projectId);
    const [label] = await db_1.default
        .insert(workspace_1.labelsTable)
        .values({ ...body, name: body.name.trim() })
        .returning();
    return label;
};
exports.createLabel = createLabel;
const updateLabel = async (userId, id, body) => {
    const label = await db_1.default.query.labelsTable.findFirst({
        where: (0, drizzle_orm_1.eq)(workspace_1.labelsTable.id, id),
    });
    if (!label)
        throw new errors_1.NotFoundError("Label not found.");
    await ensureProjectAccess(userId, label.projectId);
    const [updated] = await db_1.default
        .update(workspace_1.labelsTable)
        .set(body)
        .where((0, drizzle_orm_1.eq)(workspace_1.labelsTable.id, id))
        .returning();
    return updated;
};
exports.updateLabel = updateLabel;
const deleteLabel = async (userId, id) => {
    const label = await db_1.default.query.labelsTable.findFirst({
        where: (0, drizzle_orm_1.eq)(workspace_1.labelsTable.id, id),
    });
    if (!label)
        throw new errors_1.NotFoundError("Label not found.");
    await ensureProjectAccess(userId, label.projectId);
    const [deleted] = await db_1.default
        .delete(workspace_1.labelsTable)
        .where((0, drizzle_orm_1.eq)(workspace_1.labelsTable.id, id))
        .returning();
    return deleted;
};
exports.deleteLabel = deleteLabel;
const validateTaskRelations = async (projectId, assigneeIds, labelIds) => {
    if (assigneeIds.length) {
        const valid = await db_1.default
            .select()
            .from(workspace_1.projectMembersTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(workspace_1.projectMembersTable.projectId, projectId), (0, drizzle_orm_1.inArray)(workspace_1.projectMembersTable.userId, assigneeIds)));
        if (valid.length !== assigneeIds.length)
            throw new errors_1.BadRequestError("Every assignee must be a project member.");
    }
    if (labelIds.length) {
        const valid = await db_1.default
            .select()
            .from(workspace_1.labelsTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(workspace_1.labelsTable.projectId, projectId), (0, drizzle_orm_1.inArray)(workspace_1.labelsTable.id, labelIds)));
        if (valid.length !== labelIds.length)
            throw new errors_1.BadRequestError("Every label must belong to the project.");
    }
};
const createTask = async (userId, body) => {
    var _a, _b;
    await ensureProjectAccess(userId, body.projectId);
    const assigneeIds = (_a = body.assigneeIds) !== null && _a !== void 0 ? _a : [];
    const labelIds = (_b = body.labelIds) !== null && _b !== void 0 ? _b : [];
    await validateTaskRelations(body.projectId, assigneeIds, labelIds);
    const result = await db_1.default.transaction(async (tx) => {
        var _a, _b, _c, _d;
        const [task] = await tx
            .insert(workspace_1.tasksTable)
            .values({
            projectId: body.projectId,
            title: body.title.trim(),
            description: (_b = (_a = body.description) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "",
            status: (_c = body.status) !== null && _c !== void 0 ? _c : "todo",
            priority: (_d = body.priority) !== null && _d !== void 0 ? _d : "medium",
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            createdBy: userId,
        })
            .returning();
        if (assigneeIds.length)
            await tx.insert(workspace_1.taskAssigneesTable).values(assigneeIds.map((memberId) => ({
                taskId: task.id,
                userId: memberId,
            })));
        if (labelIds.length)
            await tx
                .insert(workspace_1.taskLabelsTable)
                .values(labelIds.map((labelId) => ({ taskId: task.id, labelId })));
        await tx.insert(workspace_1.activitiesTable).values({
            actorId: userId,
            projectId: task.projectId,
            taskId: task.id,
            text: `created task ${task.title}`,
        });
        const recipients = assigneeIds.filter((id) => id !== userId);
        const notifications = recipients.length
            ? await tx
                .insert(workspace_1.notificationsTable)
                .values(recipients.map((recipient) => ({
                userId: recipient,
                actorId: userId,
                type: "assignment",
                text: "assigned you to",
                projectId: task.projectId,
                taskId: task.id,
            })))
                .returning()
            : [];
        return { task, notifications };
    });
    publishNotifications(result.notifications);
    return result.task;
};
exports.createTask = createTask;
const updateTask = async (userId, id, body) => {
    const projectId = await getTaskProjectId(id);
    await ensureProjectAccess(userId, projectId);
    const assigneeIds = body.assigneeIds;
    const labelIds = body.labelIds;
    const existingAssignees = await db_1.default
        .select({ userId: workspace_1.taskAssigneesTable.userId })
        .from(workspace_1.taskAssigneesTable)
        .where((0, drizzle_orm_1.eq)(workspace_1.taskAssigneesTable.taskId, id));
    if (assigneeIds || labelIds)
        await validateTaskRelations(projectId, assigneeIds !== null && assigneeIds !== void 0 ? assigneeIds : [], labelIds !== null && labelIds !== void 0 ? labelIds : []);
    const result = await db_1.default.transaction(async (tx) => {
        const { assigneeIds: _assigneeIds, labelIds: _labelIds, dueDate, ...fields } = body;
        const [task] = await tx
            .update(workspace_1.tasksTable)
            .set({
            ...fields,
            ...(dueDate !== undefined
                ? { dueDate: dueDate ? new Date(dueDate) : null }
                : {}),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(workspace_1.tasksTable.id, id))
            .returning();
        if (!task)
            throw new errors_1.NotFoundError("Task not found.");
        if (assigneeIds) {
            await tx
                .delete(workspace_1.taskAssigneesTable)
                .where((0, drizzle_orm_1.eq)(workspace_1.taskAssigneesTable.taskId, id));
            if (assigneeIds.length)
                await tx
                    .insert(workspace_1.taskAssigneesTable)
                    .values(assigneeIds.map((memberId) => ({ taskId: id, userId: memberId })));
        }
        if (labelIds) {
            await tx.delete(workspace_1.taskLabelsTable).where((0, drizzle_orm_1.eq)(workspace_1.taskLabelsTable.taskId, id));
            if (labelIds.length)
                await tx
                    .insert(workspace_1.taskLabelsTable)
                    .values(labelIds.map((labelId) => ({ taskId: id, labelId })));
        }
        await tx.insert(workspace_1.activitiesTable).values({
            actorId: userId,
            projectId,
            taskId: id,
            text: `updated task ${task.title}`,
        });
        const previousIds = new Set(existingAssignees.map((item) => item.userId));
        const assignmentRecipients = (assigneeIds !== null && assigneeIds !== void 0 ? assigneeIds : []).filter((assigneeId) => assigneeId !== userId && !previousIds.has(assigneeId));
        const assignmentRecipientIds = new Set(assignmentRecipients);
        const hasTaskUpdate = Object.keys(body).some((field) => field !== "assigneeIds");
        const updateRecipients = hasTaskUpdate
            ? (assigneeIds !== null && assigneeIds !== void 0 ? assigneeIds : [...previousIds]).filter((assigneeId) => assigneeId !== userId && !assignmentRecipientIds.has(assigneeId))
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
                .insert(workspace_1.notificationsTable)
                .values(notificationValues)
                .returning()
            : [];
        return { task, notifications };
    });
    publishNotifications(result.notifications);
    return result.task;
};
exports.updateTask = updateTask;
const deleteTask = async (userId, id) => {
    const projectId = await getTaskProjectId(id);
    await ensureProjectAccess(userId, projectId);
    const [task] = await db_1.default
        .delete(workspace_1.tasksTable)
        .where((0, drizzle_orm_1.eq)(workspace_1.tasksTable.id, id))
        .returning();
    return task;
};
exports.deleteTask = deleteTask;
const createComment = async (userId, taskId, body) => {
    const projectId = await getTaskProjectId(taskId);
    await ensureProjectAccess(userId, projectId);
    const result = await db_1.default.transaction(async (tx) => {
        const [comment] = await tx
            .insert(workspace_1.commentsTable)
            .values({ taskId, authorId: userId, text: body.text.trim() })
            .returning();
        await tx.insert(workspace_1.activitiesTable).values({
            actorId: userId,
            projectId,
            taskId,
            text: "commented on a task",
        });
        const task = await tx.query.tasksTable.findFirst({
            where: (0, drizzle_orm_1.eq)(workspace_1.tasksTable.id, taskId),
            columns: { createdBy: true },
        });
        const assignees = await tx
            .select({ userId: workspace_1.taskAssigneesTable.userId })
            .from(workspace_1.taskAssigneesTable)
            .where((0, drizzle_orm_1.eq)(workspace_1.taskAssigneesTable.taskId, taskId));
        const recipients = [
            ...new Set([task === null || task === void 0 ? void 0 : task.createdBy, ...assignees.map((item) => item.userId)]),
        ].filter((recipient) => Boolean(recipient && recipient !== userId));
        const notifications = recipients.length
            ? await tx
                .insert(workspace_1.notificationsTable)
                .values(recipients.map((recipient) => ({
                userId: recipient,
                actorId: userId,
                type: "comment",
                text: "commented on",
                projectId,
                taskId,
            })))
                .returning()
            : [];
        return { comment, notifications };
    });
    publishNotifications(result.notifications);
    return result.comment;
};
exports.createComment = createComment;
const createAttachment = async (userId, taskId, body) => {
    const projectId = await getTaskProjectId(taskId);
    await ensureProjectAccess(userId, projectId);
    const [attachment] = await db_1.default
        .insert(workspace_1.attachmentsTable)
        .values({ taskId, uploadedBy: userId, ...body })
        .returning();
    await logActivity(userId, projectId, `attached ${body.name}`, taskId);
    return attachment;
};
exports.createAttachment = createAttachment;
const deleteAttachment = async (userId, id) => {
    const attachment = await db_1.default.query.attachmentsTable.findFirst({
        where: (0, drizzle_orm_1.eq)(workspace_1.attachmentsTable.id, id),
    });
    if (!attachment)
        throw new errors_1.NotFoundError("Attachment not found.");
    const projectId = await getTaskProjectId(attachment.taskId);
    await ensureProjectAccess(userId, projectId);
    await (0, file_1.removeFile)(attachment.url);
    const [deleted] = await db_1.default
        .delete(workspace_1.attachmentsTable)
        .where((0, drizzle_orm_1.eq)(workspace_1.attachmentsTable.id, id))
        .returning();
    return deleted;
};
exports.deleteAttachment = deleteAttachment;
const createSubtask = async (userId, taskId, body) => {
    const projectId = await getTaskProjectId(taskId);
    await ensureProjectAccess(userId, projectId);
    if (body.assigneeId)
        await validateTaskRelations(projectId, [body.assigneeId], []);
    const result = await db_1.default.transaction(async (tx) => {
        const [subtask] = await tx
            .insert(workspace_1.subtasksTable)
            .values({
            taskId,
            title: body.title.trim(),
            assigneeId: body.assigneeId,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
        })
            .returning();
        const notifications = body.assigneeId && body.assigneeId !== userId
            ? await tx
                .insert(workspace_1.notificationsTable)
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
exports.createSubtask = createSubtask;
const updateSubtask = async (userId, id, body) => {
    const existing = await db_1.default.query.subtasksTable.findFirst({
        where: (0, drizzle_orm_1.eq)(workspace_1.subtasksTable.id, id),
    });
    if (!existing)
        throw new errors_1.NotFoundError("Subtask not found.");
    const projectId = await getTaskProjectId(existing.taskId);
    await ensureProjectAccess(userId, projectId);
    if (body.assigneeId)
        await validateTaskRelations(projectId, [body.assigneeId], []);
    const { dueDate, ...fields } = body;
    const result = await db_1.default.transaction(async (tx) => {
        const [subtask] = await tx
            .update(workspace_1.subtasksTable)
            .set({
            ...fields,
            ...(dueDate !== undefined
                ? { dueDate: dueDate ? new Date(dueDate) : null }
                : {}),
        })
            .where((0, drizzle_orm_1.eq)(workspace_1.subtasksTable.id, id))
            .returning();
        const notifications = body.assigneeId &&
            body.assigneeId !== userId &&
            body.assigneeId !== existing.assigneeId
            ? await tx
                .insert(workspace_1.notificationsTable)
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
exports.updateSubtask = updateSubtask;
const deleteSubtask = async (userId, id) => {
    const existing = await db_1.default.query.subtasksTable.findFirst({
        where: (0, drizzle_orm_1.eq)(workspace_1.subtasksTable.id, id),
    });
    if (!existing)
        throw new errors_1.NotFoundError("Subtask not found.");
    const projectId = await getTaskProjectId(existing.taskId);
    await ensureProjectAccess(userId, projectId);
    const [subtask] = await db_1.default
        .delete(workspace_1.subtasksTable)
        .where((0, drizzle_orm_1.eq)(workspace_1.subtasksTable.id, id))
        .returning();
    return subtask;
};
exports.deleteSubtask = deleteSubtask;
const markNotification = async (userId, id) => {
    const [notification] = await db_1.default
        .update(workspace_1.notificationsTable)
        .set({ read: true })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(workspace_1.notificationsTable.id, id), (0, drizzle_orm_1.eq)(workspace_1.notificationsTable.userId, userId)))
        .returning();
    if (!notification)
        throw new errors_1.NotFoundError("Notification not found.");
    return notification;
};
exports.markNotification = markNotification;
const markAllNotifications = async (userId) => db_1.default
    .update(workspace_1.notificationsTable)
    .set({ read: true })
    .where((0, drizzle_orm_1.eq)(workspace_1.notificationsTable.userId, userId))
    .returning();
exports.markAllNotifications = markAllNotifications;
