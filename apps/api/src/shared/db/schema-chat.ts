/**
 * @module schema-chat
 * @description Canonical definitions live in lib/db/src/schema/chat-schema.ts
 * Re-exported here for backward compatibility with apps/api consumers.
 */

// Canonical definitions sourced from @workspace/db — do NOT redefine here.
export {
  chatRooms,
  chatMembers,
  chatMessages,
  chatMessageHiddenFor,
  chatRoomTags,
  chatReactions,
  chatPolls,
  chatPollVotes,
  chatMessageTasks,
  chatStarredMessages,
  chatUserPresence,
  chatEmojiPacks,
  chatCustomEmoji,
  chatJoinRequests,
  chatPushSubscriptions,
  chatVideoCalls,
  insertChatRoomSchema,
  insertChatMemberSchema,
  insertChatMessageSchema,
  insertChatReactionSchema,
  insertChatPollSchema,
  insertChatPollVoteSchema,
  insertChatMessageTaskSchema,
  insertChatStarredMessageSchema,
  insertChatUserPresenceSchema,
  insertChatEmojiPackSchema,
  insertChatCustomEmojiSchema,
  insertChatJoinRequestSchema,
  insertChatPushSubscriptionSchema,
  insertChatVideoCallSchema,
} from '@workspace/db';
export type {
  ChatRoom, InsertChatRoom,
  ChatMember, InsertChatMember,
  ChatMessage, InsertChatMessage,
  ChatReaction, InsertChatReaction,
  ChatPoll, InsertChatPoll,
  ChatPollVote, InsertChatPollVote,
  ChatMessageTask, InsertChatMessageTask,
  ChatUserPresence, InsertChatUserPresence,
  ChatVideoCall, InsertChatVideoCall,
} from '@workspace/db';

// Snake_case aliases for legacy callers that use `import { chat_rooms } from ...`
export {
  chatRooms     as chat_rooms,
  chatMembers   as chat_members,
  chatMessages  as chat_messages,
  chatReactions as chat_reactions,
  chatPolls     as chat_polls,
  chatPollVotes as chat_poll_votes,
  chatMessageTasks       as chat_message_tasks,
  chatStarredMessages    as chat_starred_messages,
  chatUserPresence       as chat_user_presence,
  chatEmojiPacks         as chat_emoji_packs,
  chatCustomEmoji        as chat_custom_emoji,
  chatJoinRequests       as chat_join_requests,
  chatPushSubscriptions  as chat_push_subscriptions,
  chatVideoCalls         as chat_video_calls,
} from '@workspace/db';
