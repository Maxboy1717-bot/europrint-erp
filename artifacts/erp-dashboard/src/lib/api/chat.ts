import { apiRequest } from "@/lib/queryClient";

export const chatApi = {
  createDirectRoom: (userId: number | string) =>
    apiRequest("POST", "/api/chat/rooms/direct", { userId }),
  createGroupRoom: (data: { name: string; memberIds: (number | string)[] }) =>
    apiRequest("POST", "/api/chat/rooms/group", data),
  sendMessage: (roomId: number | string, content: string, attachments?: unknown[]) =>
    apiRequest("POST", `/api/chat/rooms/${roomId}/messages`, { content, attachments }),
  markRoomRead: (roomId: number | string) =>
    apiRequest("POST", `/api/chat/rooms/${roomId}/read`),
  markAllNotificationsRead: () =>
    apiRequest("POST", "/api/chat/notifications/read-all"),
  markAllNotificationsReadPatch: () =>
    apiRequest("PATCH", "/api/chat/notifications/read-all"),
  markNotificationRead: (id: number | string) =>
    apiRequest("PATCH", `/api/chat/notifications/${id}/read`),
  createMessageTask: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/chat/message-tasks", data),
  archiveRoom: (roomId: number | string) =>
    apiRequest("POST", `/api/chat/admin/rooms/${roomId}/archive`),
  removeRoomMember: (roomId: number | string, userId: number | string) =>
    apiRequest("DELETE", `/api/chat/admin/rooms/${roomId}/members/${userId}`),
  updateMemberRole: (roomId: number | string, userId: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/chat/admin/rooms/${roomId}/members/${userId}/role`, data),
  pinMessage: (id: number | string) =>
    apiRequest("POST", `/api/chat/messages/${id}/pin`),
  starMessage: (id: number | string) =>
    apiRequest("POST", `/api/chat/messages/${id}/star`),
  muteRoom: (roomId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/chat/rooms/${roomId}/mute`, data),
  editMessage: (roomId: number | string, msgId: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/chat/rooms/${roomId}/messages/${msgId}`, data),
  deleteMessage: (roomId: number | string, msgId: number | string) =>
    apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${msgId}`),
  addReaction: (roomId: number | string, msgId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/chat/rooms/${roomId}/messages/${msgId}/reactions`, data),
  removeReaction: (roomId: number | string, msgId: number | string, emoji: string) =>
    apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${msgId}/reactions/${emoji}`),
  createPoll: (roomId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/chat/rooms/${roomId}/polls`, data),
  votePoll: (pollId: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/chat/polls/${pollId}/vote`, data),
};
