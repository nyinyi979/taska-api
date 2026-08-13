"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishNotificationEvent = exports.addNotificationConnection = void 0;
const connections = new Map();
const addNotificationConnection = (userId, response) => {
    var _a;
    const userConnections = (_a = connections.get(userId)) !== null && _a !== void 0 ? _a : new Set();
    userConnections.add(response);
    connections.set(userId, userConnections);
    return () => {
        userConnections.delete(response);
        if (userConnections.size === 0)
            connections.delete(userId);
    };
};
exports.addNotificationConnection = addNotificationConnection;
const publishNotificationEvent = (userId, event, data) => {
    var _a;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const response of (_a = connections.get(userId)) !== null && _a !== void 0 ? _a : []) {
        if (!response.destroyed)
            response.write(payload);
    }
};
exports.publishNotificationEvent = publishNotificationEvent;
