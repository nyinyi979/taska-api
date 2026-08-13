"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../utils/auth");
const handlers_1 = require("./handlers");
const schemas_1 = require("./schemas");
const secured = {
    preHandler: auth_1.authenticate,
    schema: { tags: ["Workspace"], security: [{ accessToken: [] }] },
};
const workspaceRoutes = async (app) => {
    app.get("", secured, handlers_1.handleGetWorkspace);
    app.get("/profile", secured, handlers_1.handleGetWorkspaceProfile);
    app.get("/projects", secured, handlers_1.handleGetWorkspaceProjects);
    app.get("/tasks", secured, handlers_1.handleGetWorkspaceTasks);
    app.get("/notifications", secured, handlers_1.handleGetWorkspaceNotifications);
    app.get("/activities", secured, handlers_1.handleGetWorkspaceActivities);
    app.get("/events", secured, handlers_1.handleNotificationEvents);
    app.post("/projects", {
        ...secured,
        schema: { ...secured.schema, body: schemas_1.createProjectBodySchema },
    }, handlers_1.handleCreateProject);
    app.post("/projects/:id/members", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.addProjectMemberBodySchema,
        },
    }, handlers_1.handleAddProjectMember);
    app.put("/projects/:id", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.updateProjectBodySchema,
        },
    }, handlers_1.handleUpdateProject);
    app.delete("/projects/:id", { ...secured, schema: { ...secured.schema, params: schemas_1.idParamsSchema } }, handlers_1.handleDeleteProject);
    app.post("/labels", { ...secured, schema: { ...secured.schema, body: schemas_1.createLabelBodySchema } }, handlers_1.handleCreateLabel);
    app.put("/labels/:id", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.updateLabelBodySchema,
        },
    }, handlers_1.handleUpdateLabel);
    app.delete("/labels/:id", { ...secured, schema: { ...secured.schema, params: schemas_1.idParamsSchema } }, handlers_1.handleDeleteLabel);
    app.post("/tasks", { ...secured, schema: { ...secured.schema, body: schemas_1.createTaskBodySchema } }, handlers_1.handleCreateTask);
    app.put("/tasks/:id", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.updateTaskBodySchema,
        },
    }, handlers_1.handleUpdateTask);
    app.delete("/tasks/:id", { ...secured, schema: { ...secured.schema, params: schemas_1.idParamsSchema } }, handlers_1.handleDeleteTask);
    app.post("/tasks/:id/comments", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.createCommentBodySchema,
        },
    }, handlers_1.handleCreateComment);
    app.post("/tasks/:id/attachments", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.createAttachmentBodySchema,
        },
    }, handlers_1.handleCreateAttachment);
    app.delete("/attachments/:id", { ...secured, schema: { ...secured.schema, params: schemas_1.idParamsSchema } }, handlers_1.handleDeleteAttachment);
    app.post("/tasks/:id/subtasks", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.createSubtaskBodySchema,
        },
    }, handlers_1.handleCreateSubtask);
    app.put("/subtasks/:id", {
        ...secured,
        schema: {
            ...secured.schema,
            params: schemas_1.idParamsSchema,
            body: schemas_1.updateSubtaskBodySchema,
        },
    }, handlers_1.handleUpdateSubtask);
    app.delete("/subtasks/:id", { ...secured, schema: { ...secured.schema, params: schemas_1.idParamsSchema } }, handlers_1.handleDeleteSubtask);
    app.patch("/notifications/:id/read", { ...secured, schema: { ...secured.schema, params: schemas_1.idParamsSchema } }, handlers_1.handleMarkNotification);
    app.post("/notifications/read-all", secured, handlers_1.handleMarkAllNotifications);
};
exports.default = workspaceRoutes;
