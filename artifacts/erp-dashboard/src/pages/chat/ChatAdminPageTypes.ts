/**
 * @module ChatAdminPageTypes
 * @description Types and interfaces for ChatAdminPage.
 */

export interface AdminRoom {
  id: string;
  name: string;
  type: string;
  description: string;
  is_archived: boolean;
  created_at: string;
  last_message_at: string;
  member_count: number;
  message_count: number;
  created_by_name: string;
}

export interface AdminMember {
  userId: string;
  fullName: string;
  employeeId: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface AuditLog {
  id: string;
  room_id: string;
  actor_id: string;
  action: string;
  target_user_id: string;
  message_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  room_name: string;
  room_type: string;
  actor_name: string;
  target_name: string;
}

export type Tab = "rooms" | "audit";

/** Maps audit action codes to i18n keys (resolved with t() at render time). */
export const ACTION_LABEL_KEYS: Record<string, string> = {
  MEMBER_ADDED: "actMemberAdded",
  MEMBER_REMOVED: "actMemberRemoved",
  ROLE_CHANGED: "actRoleChanged",
  MESSAGE_DELETED: "actMessageDeleted",
  MESSAGE_PINNED: "actMessagePinned",
  MESSAGE_UNPINNED: "actMessageUnpinned",
  ROOM_ARCHIVED: "actRoomArchived",
};
