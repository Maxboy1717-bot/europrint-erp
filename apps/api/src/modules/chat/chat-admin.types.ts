/**
 * @module chat-admin.types
 * @description Shared types for chat-admin service + repository. Extracted to
 *   break the cyclic dependency between service (which imports repo) and repo
 *   (which needs the row shapes).
 * @layer Types (chat)
 */

export interface AdminRoom {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  isArchived: boolean;
  createdAt: string;
}

export interface AdminRoomMember {
  userId: string;
  fullName: string;
  role: string;
  joinedAt: string;
}
