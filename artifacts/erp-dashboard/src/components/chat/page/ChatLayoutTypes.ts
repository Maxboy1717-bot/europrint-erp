/**
 * @module ChatLayoutTypes
 * @description Shared TypeScript interfaces, type aliases, and constants used
 * across the ChatLayout family of components. No JSX or runtime side-effects.
 */

import { ChatMessage } from "@/store/chatStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Stable empty array used as a fallback so referential equality is preserved. */
export const EMPTY_MESSAGES: ChatMessage[] = [];

/** Default video panel height in pixels. */
export const VIDEO_HEIGHT_DEFAULT = 520;

/** Expanded video panel height in pixels. */
export const VIDEO_HEIGHT_EXPANDED = 680;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A normalised member entry passed down to MentionInput so it can build
 * the @-mention autocomplete list.
 */
export interface ChatMemberEntry {
  userId: string;
  fullName: string;
  employeeId: number | null;
  avatarUrl: string | null | undefined;
}

/**
 * All props accepted by ChatLayoutSidebar.
 */
export interface ChatLayoutSidebarProps {
  showSearch: boolean;
  mobileShowChat: boolean;
  onRoomSelect: (room: import("@/store/chatStore").ChatRoom) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
}

/**
 * All props accepted by ChatLayoutMessages (the full center panel).
 */
export interface ChatLayoutMessagesProps {
  // Room context
  activeRoom: import("@/store/chatStore").ChatRoom;
  activeRoomId: string;
  messages: ChatMessage[];
  memberCount: number;
  canPin: boolean;
  isChannelReadOnly: boolean;
  activeMembers: ChatMemberEntry[];

  // Online / typing
  onlineUserIds: Set<number>;
  typingText: string | null;

  // Pinned / upload
  pinnedMessage: { id: string; content: string; senderName: string } | null;
  uploadProgress: string | null;

  // Editing / replying
  editingMsg: ChatMessage | null;
  replyToMsg: ChatMessage | null;
  onCancelEdit: () => void;
  onCancelReply: () => void;

  // Video call
  videoCallUrl: string | null;
  videoLoading: boolean;
  videoHeight: number;
  videoMinimized: boolean;
  onVideoCall: () => void;
  onVideoClose: () => void;
  onVideoToggleMinimize: () => void;
  onVideoToggleHeight: () => void;

  // Header actions
  showSearch: boolean;
  infoOpen: boolean;
  onToggleSearch: () => void;
  onToggleInfo: () => void;
  onMobileBack: () => void;
  onTaskFromLastMsg: () => void;

  // Message action handlers
  onSend: (content: string, replyToId?: string, mentionedUserIds?: string[]) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onReply: (msg: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  onThread: (msg: ChatMessage) => void;
  onForward: (msg: ChatMessage) => void;
  onPin: (msg: ChatMessage) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
  onVoiceMessage: (blob: Blob, durationSec: number) => Promise<void>;
  onCreatePoll: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onUnpinMessage: () => void;
}
