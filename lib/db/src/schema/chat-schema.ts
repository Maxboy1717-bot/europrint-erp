/**
 * @module chat-schema
 * @description Drizzle ORM schema for the ERP internal chat module.
 *
 * Tables: chat_rooms, chat_members, chat_messages, chat_reactions,
 *         chat_polls, chat_poll_votes, chat_message_tasks,
 *         chat_starred_messages, chat_user_presence, chat_emoji_packs,
 *         chat_custom_emoji, chat_join_requests, chat_push_subscriptions,
 *         chat_video_calls.
 *
 * Canonical source: apps/api/src/shared/db/schema-chat.ts
 */

import {
  pgTable, text, boolean, timestamp, varchar, jsonb, integer, serial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const chatRooms = pgTable('chat_rooms', {
  id:                varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name:              text('name'),
  type:              varchar('type').notNull().default('GROUP'),
  description:       text('description'),
  avatarUrl:         text('avatar_url'),
  lastMessageText:   text('last_message_text'),
  lastMessageAt:     timestamp('last_message_at'),
  lastMessageId:     text('last_message_id'),
  memberCount:       integer('member_count').default(0),
  isArchived:        boolean('is_archived').default(false),
  isReadOnly:        boolean('is_read_only').default(false),
  contextType:       varchar('context_type'),
  contextId:         varchar('context_id'),
  createdBy:         text('created_by'),
  createdAt:         timestamp('created_at').defaultNow(),
  updatedAt:         timestamp('updated_at').defaultNow(),
});

export const chatMembers = pgTable('chat_members', {
  id:                   varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  roomId:               varchar('room_id').notNull(),
  userId:               text('user_id').notNull(),
  role:                 varchar('role').default('MEMBER'),
  unreadCount:          integer('unread_count').default(0),
  isMuted:              boolean('is_muted').default(false),
  mutedUntil:           timestamp('muted_until'),
  joinedAt:             timestamp('joined_at').defaultNow(),
  leftAt:               timestamp('left_at'),
  lastMessageAt:        timestamp('last_message_at'),
  lastReadAt:           timestamp('last_read_at'),
  lastReadMessageId:    text('last_read_message_id'),
});

export const chatMessages = pgTable('chat_messages', {
  id:               varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  roomId:           varchar('room_id').notNull(),
  senderId:         text('sender_id').notNull(),
  content:          text('content'),
  text:             text('text'),
  fileUrl:          text('file_url'),
  fileName:         text('file_name'),
  fileType:         text('file_type'),
  messageType:      varchar('message_type').default('TEXT'),
  isDeleted:        boolean('is_deleted').default(false),
  isEdited:         boolean('is_edited').default(false),
  isPinned:         boolean('is_pinned').default(false),
  replyToId:        varchar('reply_to_id'),
  threadRootId:     varchar('thread_root_id'),
  forwardFromId:    varchar('forward_from_id'),
  threadCount:      integer('thread_count').default(0),
  mentionedUserIds: jsonb('mentioned_user_ids').default(sql`'[]'::jsonb`),
  clientMsgId:      text('client_msg_id'),
  createdAt:        timestamp('created_at').defaultNow(),
});

export const chatReactions = pgTable('chat_reactions', {
  id:        varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar('message_id').notNull(),
  userId:    text('user_id').notNull(),
  emoji:     varchar('emoji').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatPolls = pgTable('chat_polls', {
  id:          varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  messageId:   varchar('message_id'),
  roomId:      varchar('room_id'),
  createdBy:   text('created_by'),
  question:    text('question').notNull(),
  options:     jsonb('options').notNull().default(sql`'[]'::jsonb`),
  isMultiple:  boolean('is_multiple').default(false),
  isAnonymous: boolean('is_anonymous').default(false),
  expiresAt:   timestamp('expires_at'),
  closesAt:    timestamp('closes_at'),
  isClosed:    boolean('is_closed').default(false),
  totalVotes:  integer('total_votes').default(0),
  createdAt:   timestamp('created_at').defaultNow(),
});

export const chatPollVotes = pgTable('chat_poll_votes', {
  id:          varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  pollId:      varchar('poll_id').notNull(),
  userId:      text('user_id').notNull(),
  optionIndex: integer('option_index'),
  optionIds:   jsonb('option_ids').default(sql`'[]'::jsonb`),
  votedAt:     timestamp('voted_at').defaultNow(),
});

export const chatMessageTasks = pgTable('chat_message_tasks', {
  id:         varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  messageId:  varchar('message_id'),
  roomId:     varchar('room_id'),
  title:      text('title'),
  assignedTo: text('assigned_to'),
  dueDate:    text('due_date'),
  priority:   varchar('priority'),
  status:     varchar('status').default('pending'),
  createdBy:  text('created_by'),
  createdAt:  timestamp('created_at').defaultNow(),
});

export const chatStarredMessages = pgTable('chat_starred_messages', {
  id:        varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar('message_id').notNull(),
  userId:    varchar('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatUserPresence = pgTable('chat_user_presence', {
  userId:       text('user_id').primaryKey(),
  status:       varchar('status').default('OFFLINE'),
  customStatus: text('custom_status'),
  // Work-status shown in the employee info panel (ishda/band/tushlikda/
  // tatilda/tashqarida) — distinct from the ONLINE/OFFLINE socket presence.
  workStatus:   varchar('work_status', { length: 20 }),
  lastSeenAt:   timestamp('last_seen_at'),
  activeRoomId: varchar('active_room_id'),
  updatedAt:    timestamp('updated_at').defaultNow(),
});

// Conversation tags for the employee info panel (Muhim/Kutilmoqda/Tezkor …).
// room_id is INTEGER to match the live chat_rooms.id column.
export const chatRoomTags = pgTable('chat_room_tags', {
  id:        serial('id').primaryKey(),
  roomId:    integer('room_id').notNull(),
  tag:       varchar('tag', { length: 40 }).notNull(),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const chatEmojiPacks = pgTable('chat_emoji_packs', {
  id:        varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name:      varchar('name').notNull(),
  slug:      varchar('slug').notNull(),
  isCompany: boolean('is_company').default(false),
  isDefault: boolean('is_default').default(false),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatCustomEmoji = pgTable('chat_custom_emoji', {
  id:        varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  packId:    varchar('pack_id').notNull(),
  code:      varchar('code').notNull(),
  imageUrl:  text('image_url').notNull(),
  width:     integer('width'),
  height:    integer('height'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatJoinRequests = pgTable('chat_join_requests', {
  id:        varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  roomId:    varchar('room_id').notNull(),
  userId:    text('user_id').notNull(),
  status:    varchar('status').default('PENDING'),
  message:   text('message'),
  decidedBy: text('decided_by'),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatPushSubscriptions = pgTable('chat_push_subscriptions', {
  id:         varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId:     text('user_id').notNull(),
  channel:    varchar('channel').notNull(),
  endpoint:   text('endpoint'),
  p256dh:     text('p256dh'),
  auth:       text('auth'),
  fcmToken:   text('fcm_token'),
  apnsToken:  text('apns_token'),
  deviceInfo: jsonb('device_info'),
  isActive:   boolean('is_active').default(true),
  createdAt:  timestamp('created_at').defaultNow(),
});

export const chatVideoCalls = pgTable('chat_video_calls', {
  id:           varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  roomId:       varchar('room_id').notNull(),
  initiatorId:  text('initiator_id').notNull(),
  status:       varchar('status').default('RINGING'),
  startedAt:    timestamp('started_at').defaultNow(),
  endedAt:      timestamp('ended_at'),
  durationSec:  integer('duration_sec'),
  participants: jsonb('participants').default(sql`'[]'::jsonb`),
  iceServers:   jsonb('ice_servers'),
});

// Per-user "delete for me" hide state. The message row itself is NEVER
// hard-deleted (ERP chat = official audit channel, immutable at storage);
// a hidden row just filters that message out of THIS user's view. NB:
// message_id is INTEGER to match the live chat_messages.id column (the
// Drizzle chatMessages.id def is drifted to varchar — see Phase-4 #23);
// logical ref, no FK.
export const chatMessageHiddenFor = pgTable('chat_message_hidden_for', {
  id:        serial('id').primaryKey(),
  messageId: integer('message_id').notNull(),
  userId:    integer('user_id').notNull(),
  hiddenAt:  timestamp('hidden_at', { withTimezone: true }).defaultNow(),
});

// ── Insert schemas ─────────────────────────────────────────────────────────────
export const insertChatRoomSchema              = createInsertSchema(chatRooms).omit({ createdAt: true, updatedAt: true } as never);
export const insertChatMemberSchema            = createInsertSchema(chatMembers);
export const insertChatMessageSchema           = createInsertSchema(chatMessages).omit({ createdAt: true } as never);
export const insertChatReactionSchema          = createInsertSchema(chatReactions).omit({ createdAt: true } as never);
export const insertChatPollSchema              = createInsertSchema(chatPolls).omit({ createdAt: true } as never);
export const insertChatPollVoteSchema          = createInsertSchema(chatPollVotes);
export const insertChatMessageTaskSchema       = createInsertSchema(chatMessageTasks).omit({ createdAt: true } as never);
export const insertChatStarredMessageSchema    = createInsertSchema(chatStarredMessages).omit({ createdAt: true } as never);
export const insertChatUserPresenceSchema      = createInsertSchema(chatUserPresence);
export const insertChatEmojiPackSchema         = createInsertSchema(chatEmojiPacks).omit({ createdAt: true } as never);
export const insertChatCustomEmojiSchema       = createInsertSchema(chatCustomEmoji).omit({ createdAt: true } as never);
export const insertChatJoinRequestSchema       = createInsertSchema(chatJoinRequests).omit({ createdAt: true } as never);
export const insertChatPushSubscriptionSchema  = createInsertSchema(chatPushSubscriptions).omit({ createdAt: true } as never);
export const insertChatVideoCallSchema         = createInsertSchema(chatVideoCalls);

// ── Types ──────────────────────────────────────────────────────────────────────
export type ChatRoom              = typeof chatRooms.$inferSelect;
export type InsertChatRoom        = z.infer<typeof insertChatRoomSchema>;
export type ChatMember            = typeof chatMembers.$inferSelect;
export type InsertChatMember      = z.infer<typeof insertChatMemberSchema>;
export type ChatMessage           = typeof chatMessages.$inferSelect;
export type InsertChatMessage     = z.infer<typeof insertChatMessageSchema>;
export type ChatReaction          = typeof chatReactions.$inferSelect;
export type InsertChatReaction    = z.infer<typeof insertChatReactionSchema>;
export type ChatPoll              = typeof chatPolls.$inferSelect;
export type InsertChatPoll        = z.infer<typeof insertChatPollSchema>;
export type ChatPollVote          = typeof chatPollVotes.$inferSelect;
export type InsertChatPollVote    = z.infer<typeof insertChatPollVoteSchema>;
export type ChatMessageTask       = typeof chatMessageTasks.$inferSelect;
export type InsertChatMessageTask = z.infer<typeof insertChatMessageTaskSchema>;
export type ChatUserPresence      = typeof chatUserPresence.$inferSelect;
export type InsertChatUserPresence = z.infer<typeof insertChatUserPresenceSchema>;
export type ChatVideoCall         = typeof chatVideoCalls.$inferSelect;
export type InsertChatVideoCall   = z.infer<typeof insertChatVideoCallSchema>;
