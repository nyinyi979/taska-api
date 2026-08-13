import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { authenticate } from "../../utils/auth";
import {
  handleAddProjectMember,
  handleCreateAttachment,
  handleCreateComment,
  handleCreateLabel,
  handleCreateProject,
  handleCreateSubtask,
  handleCreateTask,
  handleDeleteAttachment,
  handleDeleteLabel,
  handleDeleteProject,
  handleDeleteSubtask,
  handleDeleteTask,
  handleGetWorkspace,
  handleGetWorkspaceActivities,
  handleGetWorkspaceNotifications,
  handleGetWorkspaceProfile,
  handleGetWorkspaceProjects,
  handleGetWorkspaceTasks,
  handleMarkAllNotifications,
  handleMarkNotification,
  handleNotificationEvents,
  handleUpdateLabel,
  handleUpdateProject,
  handleUpdateSubtask,
  handleUpdateTask,
} from "./handlers";
import {
  addProjectMemberBodySchema,
  createAttachmentBodySchema,
  createCommentBodySchema,
  createLabelBodySchema,
  createProjectBodySchema,
  createSubtaskBodySchema,
  createTaskBodySchema,
  idParamsSchema,
  updateLabelBodySchema,
  updateProjectBodySchema,
  updateSubtaskBodySchema,
  updateTaskBodySchema,
} from "./schemas";

const secured = {
  preHandler: authenticate,
  schema: { tags: ["Workspace"], security: [{ accessToken: [] }] },
};
const workspaceRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get("", secured, handleGetWorkspace);
  app.get("/profile", secured, handleGetWorkspaceProfile);
  app.get("/projects", secured, handleGetWorkspaceProjects);
  app.get("/tasks", secured, handleGetWorkspaceTasks);
  app.get("/notifications", secured, handleGetWorkspaceNotifications);
  app.get("/activities", secured, handleGetWorkspaceActivities);
  app.get("/events", secured, handleNotificationEvents);
  app.post(
    "/projects",
    {
      ...secured,
      schema: { ...secured.schema, body: createProjectBodySchema },
    },
    handleCreateProject,
  );
  app.post(
    "/projects/:id/members",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: addProjectMemberBodySchema,
      },
    },
    handleAddProjectMember,
  );
  app.put(
    "/projects/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: updateProjectBodySchema,
      },
    },
    handleUpdateProject,
  );
  app.delete(
    "/projects/:id",
    { ...secured, schema: { ...secured.schema, params: idParamsSchema } },
    handleDeleteProject,
  );
  app.post(
    "/labels",
    { ...secured, schema: { ...secured.schema, body: createLabelBodySchema } },
    handleCreateLabel,
  );
  app.put(
    "/labels/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: updateLabelBodySchema,
      },
    },
    handleUpdateLabel,
  );
  app.delete(
    "/labels/:id",
    { ...secured, schema: { ...secured.schema, params: idParamsSchema } },
    handleDeleteLabel,
  );
  app.post(
    "/tasks",
    { ...secured, schema: { ...secured.schema, body: createTaskBodySchema } },
    handleCreateTask,
  );
  app.put(
    "/tasks/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: updateTaskBodySchema,
      },
    },
    handleUpdateTask,
  );
  app.delete(
    "/tasks/:id",
    { ...secured, schema: { ...secured.schema, params: idParamsSchema } },
    handleDeleteTask,
  );
  app.post(
    "/tasks/:id/comments",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: createCommentBodySchema,
      },
    },
    handleCreateComment,
  );
  app.post(
    "/tasks/:id/attachments",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: createAttachmentBodySchema,
      },
    },
    handleCreateAttachment,
  );
  app.delete(
    "/attachments/:id",
    { ...secured, schema: { ...secured.schema, params: idParamsSchema } },
    handleDeleteAttachment,
  );
  app.post(
    "/tasks/:id/subtasks",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: createSubtaskBodySchema,
      },
    },
    handleCreateSubtask,
  );
  app.put(
    "/subtasks/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        params: idParamsSchema,
        body: updateSubtaskBodySchema,
      },
    },
    handleUpdateSubtask,
  );
  app.delete(
    "/subtasks/:id",
    { ...secured, schema: { ...secured.schema, params: idParamsSchema } },
    handleDeleteSubtask,
  );
  app.patch(
    "/notifications/:id/read",
    { ...secured, schema: { ...secured.schema, params: idParamsSchema } },
    handleMarkNotification,
  );
  app.post("/notifications/read-all", secured, handleMarkAllNotifications);
};

export default workspaceRoutes;
