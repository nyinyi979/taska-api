import { FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../../utils/auth";
import { messages } from "../messages";
import { TypeBoxRequest } from "../request";
import {
  addProjectMember,
  createAttachment,
  createComment,
  createLabel,
  createProject,
  createSubtask,
  createTask,
  deleteAttachment,
  deleteLabel,
  deleteProject,
  deleteSubtask,
  deleteTask,
  getWorkspace,
  getWorkspaceActivities,
  getWorkspaceNotifications,
  getWorkspaceProfile,
  getWorkspaceProjects,
  getWorkspaceTasks,
  getNotificationsAfter,
  markAllNotifications,
  markNotification,
  updateLabel,
  updateProject,
  updateSubtask,
  updateTask,
} from "./controllers";
import { addNotificationConnection } from "./events";
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

const userId = async (req: FastifyRequest, res: FastifyReply) =>
  (await authenticate(req, res)).id;
const ok = (res: FastifyReply, data: unknown) =>
  res.code(200).send({ ...messages.verifyOk, data });
const created = (res: FastifyReply, data: unknown) =>
  res.code(201).send({ ...messages.createOk, data });

export const handleGetWorkspace = async (
  req: FastifyRequest,
  res: FastifyReply,
) => ok(res, await getWorkspace(await userId(req, res)));
export const handleGetWorkspaceProfile = async (
  req: FastifyRequest,
  res: FastifyReply,
) => ok(res, await getWorkspaceProfile(await userId(req, res)));
export const handleGetWorkspaceProjects = async (
  req: FastifyRequest,
  res: FastifyReply,
) => ok(res, await getWorkspaceProjects(await userId(req, res)));
export const handleGetWorkspaceTasks = async (
  req: FastifyRequest,
  res: FastifyReply,
) => ok(res, await getWorkspaceTasks(await userId(req, res)));
export const handleGetWorkspaceNotifications = async (
  req: FastifyRequest,
  res: FastifyReply,
) => ok(res, await getWorkspaceNotifications(await userId(req, res)));
export const handleGetWorkspaceActivities = async (
  req: FastifyRequest,
  res: FastifyReply,
) => ok(res, await getWorkspaceActivities(await userId(req, res)));
export const handleNotificationEvents = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  const id = await userId(req, res);
  res.hijack();
  res.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering": "no",
  });
  res.raw.write("retry: 3000\nevent: ready\ndata: {}\n\n");
  const removeConnection = addNotificationConnection(id, res.raw);
  const heartbeat = setInterval(() => res.raw.write(": heartbeat\n\n"), 25_000);
  // Small overlap closes the gap between the initial notification fetch and SSE.
  // The frontend de-duplicates notifications by ID.
  let cursor = new Date(Date.now() - 10_000);
  let polling = false;
  const poll = setInterval(async () => {
    if (polling || res.raw.destroyed) return;
    polling = true;
    try {
      const notifications = await getNotificationsAfter(id, cursor);
      for (const notification of notifications) {
        res.raw.write(
          `event: notification\ndata: ${JSON.stringify(notification)}\n\n`,
        );
        cursor = notification.createdAt;
      }
    } catch (error) {
      req.log.error(error, "Notification SSE polling failed");
    } finally {
      polling = false;
    }
  }, 5_000);
  req.raw.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(poll);
    removeConnection();
  });
};
export const handleCreateProject = async (
  req: TypeBoxRequest<{ body: typeof createProjectBodySchema }>,
  res: FastifyReply,
) => created(res, await createProject(await userId(req, res), req.body));
export const handleAddProjectMember = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof addProjectMemberBodySchema;
  }>,
  res: FastifyReply,
) =>
  created(
    res,
    await addProjectMember(await userId(req, res), req.params.id, req.body),
  );
export const handleUpdateProject = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof updateProjectBodySchema;
  }>,
  res: FastifyReply,
) =>
  ok(res, await updateProject(await userId(req, res), req.params.id, req.body));
export const handleDeleteProject = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => ok(res, await deleteProject(await userId(req, res), req.params.id));
export const handleCreateLabel = async (
  req: TypeBoxRequest<{ body: typeof createLabelBodySchema }>,
  res: FastifyReply,
) => created(res, await createLabel(await userId(req, res), req.body));
export const handleUpdateLabel = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof updateLabelBodySchema;
  }>,
  res: FastifyReply,
) =>
  ok(res, await updateLabel(await userId(req, res), req.params.id, req.body));
export const handleDeleteLabel = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => ok(res, await deleteLabel(await userId(req, res), req.params.id));
export const handleCreateTask = async (
  req: TypeBoxRequest<{ body: typeof createTaskBodySchema }>,
  res: FastifyReply,
) => created(res, await createTask(await userId(req, res), req.body));
export const handleUpdateTask = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof updateTaskBodySchema;
  }>,
  res: FastifyReply,
) => ok(res, await updateTask(await userId(req, res), req.params.id, req.body));
export const handleDeleteTask = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => ok(res, await deleteTask(await userId(req, res), req.params.id));
export const handleCreateComment = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof createCommentBodySchema;
  }>,
  res: FastifyReply,
) =>
  created(
    res,
    await createComment(await userId(req, res), req.params.id, req.body),
  );
export const handleCreateAttachment = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof createAttachmentBodySchema;
  }>,
  res: FastifyReply,
) =>
  created(
    res,
    await createAttachment(await userId(req, res), req.params.id, req.body),
  );
export const handleDeleteAttachment = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => ok(res, await deleteAttachment(await userId(req, res), req.params.id));
export const handleCreateSubtask = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof createSubtaskBodySchema;
  }>,
  res: FastifyReply,
) =>
  created(
    res,
    await createSubtask(await userId(req, res), req.params.id, req.body),
  );
export const handleUpdateSubtask = async (
  req: TypeBoxRequest<{
    params: typeof idParamsSchema;
    body: typeof updateSubtaskBodySchema;
  }>,
  res: FastifyReply,
) =>
  ok(res, await updateSubtask(await userId(req, res), req.params.id, req.body));
export const handleDeleteSubtask = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => ok(res, await deleteSubtask(await userId(req, res), req.params.id));
export const handleMarkNotification = async (
  req: TypeBoxRequest<{ params: typeof idParamsSchema }>,
  res: FastifyReply,
) => ok(res, await markNotification(await userId(req, res), req.params.id));
export const handleMarkAllNotifications = async (
  req: FastifyRequest,
  res: FastifyReply,
) => ok(res, await markAllNotifications(await userId(req, res)));
