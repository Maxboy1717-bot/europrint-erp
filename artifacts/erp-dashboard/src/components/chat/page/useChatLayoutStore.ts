/**
 * @module useChatLayoutStore
 * @description Custom hook that selects all ChatLayout state from chatStore
 * and derives computed values. Split from ChatLayout.tsx (Rule 16).
 */

import { useChatStore, ChatMessage } from "@/store/chatStore";
import { EMPTY_MESSAGES } from "./ChatLayoutTypes";
import type { ChatMemberEntry } from "./ChatLayoutTypes";

export function useChatLayoutStore() {
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const rooms = useChatStore((s) => s.rooms);
  const members = useChatStore((s) => s.members);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const infoOpen = useChatStore((s) => s.infoOpen);
  const setInfoOpen = useChatStore((s) => s.setInfoOpen);
  const toggleInfo = useChatStore((s) => s.toggleInfo);
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);
  const threadRootId = useChatStore((s) => s.threadRootId);
  const setThreadRootId = useChatStore((s) => s.setThreadRootId);
  const messages = useChatStore(
    (s) => (activeRoomId ? s.messages[activeRoomId] : null) ?? EMPTY_MESSAGES
  );
  const pinnedMessages = useChatStore((s) => s.pinnedMessages);
  const typingUsers = useChatStore((s) =>
    activeRoomId ? s.typingUsers[activeRoomId] : undefined
  );
  const currentUserRole = useChatStore((s) => {
    const room = s.rooms?.find((r) => r.id === s.activeRoomId);
    return room?.memberRole;
  });

  // Derived values
  const activeRoom =
    (Array.isArray(rooms) ? rooms : []).find((r) => r.id === activeRoomId) ?? null;
  const canPin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const pinnedMessage = activeRoomId ? pinnedMessages[activeRoomId] ?? null : null;
  const threadRootMsg = threadRootId
    ? (Array.isArray(messages) ? messages : []).find((m) => m.id === threadRootId) ?? null
    : null;
  const activeMembers: ChatMemberEntry[] = activeRoomId
    ? (members[activeRoomId] ?? []).map((m) => ({
        userId: String(m.userId),
        fullName: m.fullName,
        employeeId:
          typeof m.employeeId === 'number'
            ? m.employeeId
            : m.employeeId != null && /^\d+$/.test(String(m.employeeId))
              ? Number(m.employeeId)
              : null,
        avatarUrl: m.avatarUrl ?? null,
      }))
    : [];
  const isChannelReadOnly =
    activeRoom?.type === "channel" && activeRoom?.memberRole === "MEMBER";
  const memberCount = activeRoomId ? (members[activeRoomId] ?? []).length : 0;

  return {
    activeRoomId, rooms, members, onlineUserIds,
    infoOpen, setInfoOpen, toggleInfo,
    setActiveRoomId, threadRootId, setThreadRootId,
    messages, pinnedMessages, typingUsers,
    // Derived
    activeRoom, canPin, pinnedMessage, threadRootMsg,
    activeMembers, isChannelReadOnly, memberCount,
  };
}
