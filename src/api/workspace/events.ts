import type { ServerResponse } from "node:http";

const connections = new Map<string, Set<ServerResponse>>();

export const addNotificationConnection = (
  userId: string,
  response: ServerResponse,
) => {
  const userConnections = connections.get(userId) ?? new Set<ServerResponse>();
  userConnections.add(response);
  connections.set(userId, userConnections);

  return () => {
    userConnections.delete(response);
    if (userConnections.size === 0) connections.delete(userId);
  };
};

export const publishNotificationEvent = (
  userId: string,
  event: string,
  data: unknown,
) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const response of connections.get(userId) ?? []) {
    if (!response.destroyed) response.write(payload);
  }
};
