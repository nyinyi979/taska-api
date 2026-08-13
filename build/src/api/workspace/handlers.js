"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMarkAllNotifications = exports.handleMarkNotification = exports.handleDeleteSubtask = exports.handleUpdateSubtask = exports.handleCreateSubtask = exports.handleDeleteAttachment = exports.handleCreateAttachment = exports.handleCreateComment = exports.handleDeleteTask = exports.handleUpdateTask = exports.handleCreateTask = exports.handleDeleteLabel = exports.handleUpdateLabel = exports.handleCreateLabel = exports.handleDeleteProject = exports.handleUpdateProject = exports.handleAddProjectMember = exports.handleCreateProject = exports.handleNotificationEvents = exports.handleGetWorkspaceActivities = exports.handleGetWorkspaceNotifications = exports.handleGetWorkspaceTasks = exports.handleGetWorkspaceProjects = exports.handleGetWorkspaceProfile = exports.handleGetWorkspace = void 0;
const auth_1 = require("../../utils/auth");
const messages_1 = require("../messages");
const controllers_1 = require("./controllers");
const events_1 = require("./events");
const userId = async (req, res) => (await (0, auth_1.authenticate)(req, res)).id;
const ok = (res, data) => res.code(200).send({ ...messages_1.messages.verifyOk, data });
const created = (res, data) => res.code(201).send({ ...messages_1.messages.createOk, data });
const handleGetWorkspace = async (req, res) => ok(res, await (0, controllers_1.getWorkspace)(await userId(req, res)));
exports.handleGetWorkspace = handleGetWorkspace;
const handleGetWorkspaceProfile = async (req, res) => ok(res, await (0, controllers_1.getWorkspaceProfile)(await userId(req, res)));
exports.handleGetWorkspaceProfile = handleGetWorkspaceProfile;
const handleGetWorkspaceProjects = async (req, res) => ok(res, await (0, controllers_1.getWorkspaceProjects)(await userId(req, res)));
exports.handleGetWorkspaceProjects = handleGetWorkspaceProjects;
const handleGetWorkspaceTasks = async (req, res) => ok(res, await (0, controllers_1.getWorkspaceTasks)(await userId(req, res)));
exports.handleGetWorkspaceTasks = handleGetWorkspaceTasks;
const handleGetWorkspaceNotifications = async (req, res) => ok(res, await (0, controllers_1.getWorkspaceNotifications)(await userId(req, res)));
exports.handleGetWorkspaceNotifications = handleGetWorkspaceNotifications;
const handleGetWorkspaceActivities = async (req, res) => ok(res, await (0, controllers_1.getWorkspaceActivities)(await userId(req, res)));
exports.handleGetWorkspaceActivities = handleGetWorkspaceActivities;
const handleNotificationEvents = async (req, res) => {
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
    const removeConnection = (0, events_1.addNotificationConnection)(id, res.raw);
    const heartbeat = setInterval(() => res.raw.write(": heartbeat\n\n"), 25000);
    // Small overlap closes the gap between the initial notification fetch and SSE.
    // The frontend de-duplicates notifications by ID.
    let cursor = new Date(Date.now() - 10000);
    let polling = false;
    const poll = setInterval(async () => {
        if (polling || res.raw.destroyed)
            return;
        polling = true;
        try {
            const notifications = await (0, controllers_1.getNotificationsAfter)(id, cursor);
            for (const notification of notifications) {
                res.raw.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
                cursor = notification.createdAt;
            }
        }
        catch (error) {
            req.log.error(error, "Notification SSE polling failed");
        }
        finally {
            polling = false;
        }
    }, 5000);
    req.raw.on("close", () => {
        clearInterval(heartbeat);
        clearInterval(poll);
        removeConnection();
    });
};
exports.handleNotificationEvents = handleNotificationEvents;
const handleCreateProject = async (req, res) => created(res, await (0, controllers_1.createProject)(await userId(req, res), req.body));
exports.handleCreateProject = handleCreateProject;
const handleAddProjectMember = async (req, res) => created(res, await (0, controllers_1.addProjectMember)(await userId(req, res), req.params.id, req.body));
exports.handleAddProjectMember = handleAddProjectMember;
const handleUpdateProject = async (req, res) => ok(res, await (0, controllers_1.updateProject)(await userId(req, res), req.params.id, req.body));
exports.handleUpdateProject = handleUpdateProject;
const handleDeleteProject = async (req, res) => ok(res, await (0, controllers_1.deleteProject)(await userId(req, res), req.params.id));
exports.handleDeleteProject = handleDeleteProject;
const handleCreateLabel = async (req, res) => created(res, await (0, controllers_1.createLabel)(await userId(req, res), req.body));
exports.handleCreateLabel = handleCreateLabel;
const handleUpdateLabel = async (req, res) => ok(res, await (0, controllers_1.updateLabel)(await userId(req, res), req.params.id, req.body));
exports.handleUpdateLabel = handleUpdateLabel;
const handleDeleteLabel = async (req, res) => ok(res, await (0, controllers_1.deleteLabel)(await userId(req, res), req.params.id));
exports.handleDeleteLabel = handleDeleteLabel;
const handleCreateTask = async (req, res) => created(res, await (0, controllers_1.createTask)(await userId(req, res), req.body));
exports.handleCreateTask = handleCreateTask;
const handleUpdateTask = async (req, res) => ok(res, await (0, controllers_1.updateTask)(await userId(req, res), req.params.id, req.body));
exports.handleUpdateTask = handleUpdateTask;
const handleDeleteTask = async (req, res) => ok(res, await (0, controllers_1.deleteTask)(await userId(req, res), req.params.id));
exports.handleDeleteTask = handleDeleteTask;
const handleCreateComment = async (req, res) => created(res, await (0, controllers_1.createComment)(await userId(req, res), req.params.id, req.body));
exports.handleCreateComment = handleCreateComment;
const handleCreateAttachment = async (req, res) => created(res, await (0, controllers_1.createAttachment)(await userId(req, res), req.params.id, req.body));
exports.handleCreateAttachment = handleCreateAttachment;
const handleDeleteAttachment = async (req, res) => ok(res, await (0, controllers_1.deleteAttachment)(await userId(req, res), req.params.id));
exports.handleDeleteAttachment = handleDeleteAttachment;
const handleCreateSubtask = async (req, res) => created(res, await (0, controllers_1.createSubtask)(await userId(req, res), req.params.id, req.body));
exports.handleCreateSubtask = handleCreateSubtask;
const handleUpdateSubtask = async (req, res) => ok(res, await (0, controllers_1.updateSubtask)(await userId(req, res), req.params.id, req.body));
exports.handleUpdateSubtask = handleUpdateSubtask;
const handleDeleteSubtask = async (req, res) => ok(res, await (0, controllers_1.deleteSubtask)(await userId(req, res), req.params.id));
exports.handleDeleteSubtask = handleDeleteSubtask;
const handleMarkNotification = async (req, res) => ok(res, await (0, controllers_1.markNotification)(await userId(req, res), req.params.id));
exports.handleMarkNotification = handleMarkNotification;
const handleMarkAllNotifications = async (req, res) => ok(res, await (0, controllers_1.markAllNotifications)(await userId(req, res)));
exports.handleMarkAllNotifications = handleMarkAllNotifications;
