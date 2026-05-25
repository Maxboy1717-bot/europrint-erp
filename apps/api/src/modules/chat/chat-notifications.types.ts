/**
 * @module chat-notifications.types
 * @description Shared types for chat-notifications service + repository.
 *   Extracted to break the cyclic dependency.
 * @layer Types (chat)
 */

export interface ChatNotificationItem {
  id: string;
  type: 'MENTION' | 'REPLY' | 'MESSAGE' | 'SYSTEM';
  roomId: string;
  messageId: string;
  roomName: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageTask {
  id: string;
  roomId: string;
  messageId: string;
  title: string;
  assignedTo: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  createdAt: string;
}
