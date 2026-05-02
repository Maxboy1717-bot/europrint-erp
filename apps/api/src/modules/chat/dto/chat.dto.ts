import { z } from 'zod';
import { MAX_NOTES_LENGTH, MAX_NAME_LENGTH } from '@common/constants/app.constants';

export const ChatStartDirectSchema = z.object({
  targetUserId: z.number().int().positive(),
});
export type ChatStartDirectDto = z.infer<typeof ChatStartDirectSchema>;

export const ChatCreateGroupSchema = z.object({
  name:      z.string().min(1).max(MAX_NAME_LENGTH),
  memberIds: z.array(z.number().int().positive()).min(1),
});
export type ChatCreateGroupDto = z.infer<typeof ChatCreateGroupSchema>;

export const ChatSendMessageSchema = z.object({
  content:   z.string().min(1).max(MAX_NOTES_LENGTH),
  fileUrl:   z.string().url().optional(),
  fileName:  z.string().max(255).optional(),
  fileType:  z.string().max(100).optional(),
  replyToId: z.number().int().positive().optional(),
});
export type ChatSendMessageDto = z.infer<typeof ChatSendMessageSchema>;

export const ChatMuteRoomSchema = z.object({
  muted: z.boolean(),
});
export type ChatMuteRoomDto = z.infer<typeof ChatMuteRoomSchema>;

export const ChatEditMessageSchema = z.object({
  content: z.string().min(1).max(MAX_NOTES_LENGTH),
});
export type ChatEditMessageDto = z.infer<typeof ChatEditMessageSchema>;

export const ChatEmojiSchema = z.object({
  emoji: z.string().min(1).max(50),
});
export type ChatEmojiDto = z.infer<typeof ChatEmojiSchema>;

export const ChatCreatePollSchema = z.object({
  question:    z.string().min(1).max(MAX_NOTES_LENGTH),
  options:     z.array(z.string().min(1)).min(2).max(10),
  isMultiple:  z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
});
export type ChatCreatePollDto = z.infer<typeof ChatCreatePollSchema>;

export const ChatVotePollSchema = z.object({
  optionIndices: z.array(z.number().int().min(0)),
});
export type ChatVotePollDto = z.infer<typeof ChatVotePollSchema>;

export const ChatPinMessageSchema = z.object({
  pin: z.boolean().optional(),
});
export type ChatPinMessageDto = z.infer<typeof ChatPinMessageSchema>;

export const ChatAdvancedCreatePollSchema = z.object({
  roomId:      z.union([z.string().min(1), z.number().int().positive()]),
  question:    z.string().min(1).max(MAX_NOTES_LENGTH),
  options:     z.array(z.string().min(1)).min(2).max(10),
  isMultiple:  z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
});
export type ChatAdvancedCreatePollDto = z.infer<typeof ChatAdvancedCreatePollSchema>;

export const ChatAdvancedVotePollSchema = z.object({
  optionIndex: z.union([z.number().int().min(0), z.array(z.number().int().min(0))]),
});
export type ChatAdvancedVotePollDto = z.infer<typeof ChatAdvancedVotePollSchema>;

export const ChatThreadMessageSchema = z.object({
  content: z.string().min(1).max(MAX_NOTES_LENGTH),
});
export type ChatThreadMessageDto = z.infer<typeof ChatThreadMessageSchema>;

export const ChatForwardMessageSchema = z.object({
  targetRoomId: z.union([z.string().min(1), z.number().int().positive()]),
});
export type ChatForwardMessageDto = z.infer<typeof ChatForwardMessageSchema>;

export const ChatRequestUploadUrlSchema = z.object({
  name:        z.string().min(1).max(255),
  size:        z.number().positive(),
  contentType: z.string().min(1).max(100),
  roomId:      z.union([z.string().min(1), z.number().int().positive()]),
});
export type ChatRequestUploadUrlDto = z.infer<typeof ChatRequestUploadUrlSchema>;

export const ChatCompleteUploadSchema = z.object({
  roomId:   z.union([z.string().min(1), z.number().int().positive()]),
  fileUrl:  z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100),
  fileSize: z.number().positive(),
});
export type ChatCompleteUploadDto = z.infer<typeof ChatCompleteUploadSchema>;
