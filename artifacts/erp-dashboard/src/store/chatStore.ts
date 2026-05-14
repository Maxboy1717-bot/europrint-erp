/**
 * @module chatStore
 * @description Zustand / state-store slice.
 */

import { create } from "zustand";

export interface ChatRoom {
  id: string;
  name?: string;
  type: "direct" | "group" | "department" | "channel" | "context";
  displayName: string;
  avatarUrl?: string;
  avatarEmoji?: string;
  description?: string;
  isMuted?: boolean;
  otherUserId?: number | string | null;
  memberRole?: string;
  unreadCount: number;
  lastMessage?: {
    id: string;
    content?: string;
    senderName: string;
    createdAt: string;
    messageType: string;
  };
  createdAt: string;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[];
  userIds: string[];
}

export interface ChatPollData {
  id: string;
  question: string;
  options: { text: string }[];
  isMultiple: boolean;
  isAnonymous: boolean;
  votes: Record<number, { count: number; users: string[] }>;
  totalVotes: number;
  myVotes: number[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  messageType: "text" | "image" | "file" | "poll" | "system";
  isDeleted: boolean;
  isEdited?: boolean;
  isPinned?: boolean;
  replyToId?: string | null;
  replyToMessage?: {
    id: string;
    content?: string | null;
    senderName: string;
    messageType: string;
  } | null;
  forwardFromId?: string | null;
  forwardFrom?: {
    id: string;
    senderName: string;
    content?: string;
  } | null;
  threadRootId?: string | null;
  threadCount?: number;
  reactions?: ChatReaction[];
  poll?: ChatPollData;
  createdAt: string;
  senderName: string;
  senderAvatar?: string;
  senderEmployeeId?: string;
}

export interface ChatMember {
  userId: number;
  fullName: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  avatarUrl?: string;
  employeeId?: string;
  isOnline?: boolean;
}

interface ChatStore {
  activeRoomId: string | null;
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  members: Record<string, ChatMember[]>;
  onlineUserIds: Set<number>;
  typingUsers: Record<string, Set<string>>;
  totalUnread: number;
  infoOpen: boolean;
  readByOthers: Set<string>;
  threadRootId: string | null;
  threadMessages: Record<string, ChatMessage[]>;
  pinnedMessages: Record<string, { id: string; content: string; senderName: string } | null>;

  setActiveRoomId: (id: string | null) => void;
  setRooms: (rooms: ChatRoom[]) => void;
  updateRoom: (roomId: string, update: Partial<ChatRoom>) => void;
  setMessages: (roomId: string, msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  editMessage: (roomId: string, messageId: string, content: string, isEdited: boolean) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  updateReactions: (roomId: string, messageId: string, reactions: ChatReaction[]) => void;
  updatePoll: (roomId: string, messageId: string, pollData: Partial<ChatPollData>) => void;
  updateThreadCount: (roomId: string, messageId: string, threadCount: number) => void;
  setMembers: (roomId: string, members: ChatMember[]) => void;
  setOnlineUserIds: (ids: number[]) => void;
  addOnlineUser: (userId: number) => void;
  removeOnlineUser: (userId: number) => void;
  setTyping: (roomId: string, userName: string, isTyping: boolean) => void;
  setTotalUnread: (count: number) => void;
  markRoomRead: (roomId: string) => void;
  markReadByOther: (roomId: string) => void;
  toggleInfo: () => void;
  setInfoOpen: (open: boolean) => void;
  setThreadRootId: (msgId: string | null) => void;
  setThreadMessages: (rootId: string, msgs: ChatMessage[]) => void;
  addThreadMessage: (msg: ChatMessage) => void;
  setPinnedMessage: (roomId: string, pinned: { id: string; content: string; senderName: string } | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeRoomId: null,
  rooms: [],
  messages: {},
  members: {},
  onlineUserIds: new Set(),
  typingUsers: {},
  totalUnread: 0,
  infoOpen: false,
  readByOthers: new Set(),
  threadRootId: null,
  threadMessages: {},
  pinnedMessages: {},

  setActiveRoomId: (id) => set({ activeRoomId: id }),

  setRooms: (rooms) =>
    set((_s) => {
      const total = (Array.isArray(rooms) ? rooms : []).reduce((acc, r) => acc + r.unreadCount, 0);
      return { rooms, totalUnread: total };
    }),

  updateRoom: (roomId, update) =>
    set((s) => ({
      rooms: s.rooms?.map((r) => (r.id === roomId ? { ...r, ...update } : r)),
    })),

  setMessages: (roomId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: msgs } })),

  addMessage: (msg) =>
    set((s) => {
      const existing = s.messages[msg.roomId] ?? [];
      if ((Array.isArray(existing) ? existing : []).find((m) => m.id === msg.id)) return s;
      return {
        messages: { ...s.messages, [msg.roomId]: [...existing, msg] },
      };
    }),

  editMessage: (roomId, messageId, content, isEdited) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId ? { ...m, content, isEdited } : m
        ),
      },
    })),

  deleteMessage: (roomId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: undefined } : m
        ),
      },
    })),

  updateReactions: (roomId, messageId, reactions) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        ),
      },
    })),

  updatePoll: (roomId, messageId, pollData) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId && m.poll
            ? { ...m, poll: { ...m.poll, ...pollData } }
            : m
        ),
      },
    })),

  updateThreadCount: (roomId, messageId, threadCount) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId ? { ...m, threadCount } : m
        ),
      },
    })),

  setMembers: (roomId, members) =>
    set((s) => ({ members: { ...s.members, [roomId]: members } })),

  setOnlineUserIds: (ids) => set({ onlineUserIds: new Set(ids) }),

  addOnlineUser: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.add(userId);
      return { onlineUserIds: next };
    }),

  removeOnlineUser: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next };
    }),

  setTyping: (roomId, userName, isTyping) =>
    set((s) => {
      const current = new Set(s.typingUsers[roomId] ?? []);
      if (isTyping) current.add(userName);
      else current.delete(userName);
      return { typingUsers: { ...s.typingUsers, [roomId]: current } };
    }),

  setTotalUnread: (count) => set({ totalUnread: count }),

  markRoomRead: (roomId) =>
    set((s) => {
      const rooms = s.rooms?.map((r) =>
        r.id === roomId ? { ...r, unreadCount: 0 } : r
      );
      const total = (Array.isArray(rooms) ? rooms : []).reduce((acc, r) => acc + r.unreadCount, 0);
      return { rooms, totalUnread: total };
    }),

  markReadByOther: (roomId) =>
    set((s) => {
      const next = new Set(s.readByOthers);
      next.add(roomId);
      return { readByOthers: next };
    }),

  toggleInfo: () => set((s) => ({ infoOpen: !s.infoOpen })),
  setInfoOpen: (open) => set({ infoOpen: open }),

  setThreadRootId: (msgId) => set({ threadRootId: msgId }),
  setThreadMessages: (rootId, msgs) =>
    set((s) => ({ threadMessages: { ...s.threadMessages, [rootId]: msgs } })),
  addThreadMessage: (msg) =>
    set((s) => {
      const rootId = msg.threadRootId;
      if (!rootId) return s;
      const existing = s.threadMessages[rootId] ?? [];
      if ((Array.isArray(existing) ? existing : []).find((m) => m.id === msg.id)) return s;
      return { threadMessages: { ...s.threadMessages, [rootId]: [...existing, msg] } };
    }),
  setPinnedMessage: (roomId, pinned) =>
    set((s) => ({ pinnedMessages: { ...s.pinnedMessages, [roomId]: pinned } })),
}));
