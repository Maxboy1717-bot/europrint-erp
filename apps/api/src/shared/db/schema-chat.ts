import {
  pgTable, text, boolean, timestamp, varchar, jsonb, integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const chatRooms = pgTable('chat_rooms', {
  id:                varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name:              text('name'),
  type:              varchar('type').notNull().default('GROUP'),
  description:       text('description'),
  avatar_url:        text('avatar_url'),
  last_message_text: text('last_message_text'),
  last_message_at:   timestamp('last_message_at'),
  last_message_id:   text('last_message_id'),
  member_count:      integer('member_count').default(0),
  is_archived:       boolean('is_archived').default(false),
  is_read_only:      boolean('is_read_only').default(false),
  context_type:      varchar('context_type'),
  context_id:        varchar('context_id'),
  created_by:        text('created_by'),
  created_at:        timestamp('created_at').defaultNow(),
  updated_at:        timestamp('updated_at').defaultNow(),
});

export const chatMembers = pgTable('chat_members', {
  id:                   varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  room_id:              varchar('room_id').notNull(),
  user_id:              text('user_id').notNull(),
  role:                 varchar('role').default('MEMBER'),
  unread_count:         integer('unread_count').default(0),
  is_muted:             boolean('is_muted').default(false),
  muted_until:          timestamp('muted_until'),
  joined_at:            timestamp('joined_at').defaultNow(),
  left_at:              timestamp('left_at'),
  last_message_at:      timestamp('last_message_at'),
  last_read_at:         timestamp('last_read_at'),
  last_read_message_id: text('last_read_message_id'),
});

export const chatMessages = pgTable('chat_messages', {
  id:                 varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  room_id:            varchar('room_id').notNull(),
  sender_id:          text('sender_id').notNull(),
  content:            text('content'),
  text:               text('text'),
  file_url:           text('file_url'),
  file_name:          text('file_name'),
  file_type:          text('file_type'),
  message_type:       varchar('message_type').default('TEXT'),
  is_deleted:         boolean('is_deleted').default(false),
  is_edited:          boolean('is_edited').default(false),
  is_pinned:          boolean('is_pinned').default(false),
  reply_to_id:        varchar('reply_to_id'),
  thread_root_id:     varchar('thread_root_id'),
  forward_from_id:    varchar('forward_from_id'),
  thread_count:       integer('thread_count').default(0),
  mentioned_user_ids: jsonb('mentioned_user_ids').default(sql`'[]'::jsonb`),
  client_msg_id:      text('client_msg_id'),
  created_at:         timestamp('created_at').defaultNow(),
});

export const chatReactions = pgTable('chat_reactions', {
  id:         varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  message_id: varchar('message_id').notNull(),
  user_id:    text('user_id').notNull(),
  emoji:      varchar('emoji').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const chatPolls = pgTable('chat_polls', {
  id:           varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  message_id:   varchar('message_id'),
  room_id:      varchar('room_id'),
  created_by:   text('created_by'),
  question:     text('question').notNull(),
  options:      jsonb('options').notNull().default(sql`'[]'::jsonb`),
  is_multiple:  boolean('is_multiple').default(false),
  is_anonymous: boolean('is_anonymous').default(false),
  expires_at:   timestamp('expires_at'),
  closes_at:    timestamp('closes_at'),
  is_closed:    boolean('is_closed').default(false),
  total_votes:  integer('total_votes').default(0),
  created_at:   timestamp('created_at').defaultNow(),
});

export const chatPollVotes = pgTable('chat_poll_votes', {
  id:           varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  poll_id:      varchar('poll_id').notNull(),
  user_id:      text('user_id').notNull(),
  option_index: integer('option_index'),
  option_ids:   jsonb('option_ids').default(sql`'[]'::jsonb`),
  voted_at:     timestamp('voted_at').defaultNow(),
});

export const chatMessageTasks = pgTable('chat_message_tasks', {
  id:          varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  message_id:  varchar('message_id'),
  room_id:     varchar('room_id'),
  title:       text('title'),
  assigned_to: text('assigned_to'),
  due_date:    text('due_date'),
  priority:    varchar('priority'),
  status:      varchar('status').default('pending'),
  created_by:  text('created_by'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const chatStarredMessages = pgTable('chat_starred_messages', {
  id:         varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  message_id: varchar('message_id').notNull(),
  user_id:    varchar('user_id').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const chatUserPresence = pgTable('chat_user_presence', {
  user_id:        text('user_id').primaryKey(),
  status:         varchar('status').default('OFFLINE'),
  custom_status:  text('custom_status'),
  last_seen_at:   timestamp('last_seen_at'),
  active_room_id: varchar('active_room_id'),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const chatEmojiPacks = pgTable('chat_emoji_packs', {
  id:          varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name:        varchar('name').notNull(),
  slug:        varchar('slug').notNull(),
  is_company:  boolean('is_company').default(false),
  is_default:  boolean('is_default').default(false),
  created_by:  text('created_by'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const chatCustomEmoji = pgTable('chat_custom_emoji', {
  id:         varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  pack_id:    varchar('pack_id').notNull(),
  code:       varchar('code').notNull(),
  image_url:  text('image_url').notNull(),
  width:      integer('width'),
  height:     integer('height'),
  created_at: timestamp('created_at').defaultNow(),
});

export const chatJoinRequests = pgTable('chat_join_requests', {
  id:          varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  room_id:     varchar('room_id').notNull(),
  user_id:     text('user_id').notNull(),
  status:      varchar('status').default('PENDING'),
  message:     text('message'),
  decided_by:  text('decided_by'),
  decided_at:  timestamp('decided_at'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const chatPushSubscriptions = pgTable('chat_push_subscriptions', {
  id:           varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id:      text('user_id').notNull(),
  channel:      varchar('channel').notNull(),
  endpoint:     text('endpoint'),
  p256dh:       text('p256dh'),
  auth:         text('auth'),
  fcm_token:    text('fcm_token'),
  apns_token:   text('apns_token'),
  device_info:  jsonb('device_info'),
  is_active:    boolean('is_active').default(true),
  created_at:   timestamp('created_at').defaultNow(),
});

export const chatVideoCalls = pgTable('chat_video_calls', {
  id:           varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  room_id:      varchar('room_id').notNull(),
  initiator_id: text('initiator_id').notNull(),
  status:       varchar('status').default('RINGING'),
  started_at:   timestamp('started_at').defaultNow(),
  ended_at:     timestamp('ended_at'),
  duration_sec: integer('duration_sec'),
  participants: jsonb('participants').default(sql`'[]'::jsonb`),
  ice_servers:  jsonb('ice_servers'),
});

export const chat_rooms                = chatRooms;
export const chat_members              = chatMembers;
export const chat_messages             = chatMessages;
export const chat_reactions            = chatReactions;
export const chat_polls                = chatPolls;
export const chat_poll_votes           = chatPollVotes;
export const chat_message_tasks        = chatMessageTasks;
export const chat_starred_messages     = chatStarredMessages;
export const chat_user_presence        = chatUserPresence;
export const chat_emoji_packs          = chatEmojiPacks;
export const chat_custom_emoji         = chatCustomEmoji;
export const chat_join_requests        = chatJoinRequests;
export const chat_push_subscriptions   = chatPushSubscriptions;
export const chat_video_calls          = chatVideoCalls;
