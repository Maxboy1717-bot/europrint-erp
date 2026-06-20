/**
 * @module chat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, safeCall } from '@common/result';
import { ChatRoomService } from './chat-room.service';
import { ChatMessageService } from './chat-message.service';
import { ChatMessageExtService } from './chat-message-ext.service';
import { ChatRoomRepository } from './repositories/chat-room.repository';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly _userIdCache = new Map<string, number>();

  constructor(
    private readonly roomSvc: ChatRoomService,
    private readonly msgSvc: ChatMessageService,
    private readonly msgExtSvc: ChatMessageExtService,
    private readonly roomRepo: ChatRoomRepository,
    private readonly i18n: I18nService,
  ) {}

  async ensureTables(): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await this.roomRepo.ensureChatTables();
      await this.roomRepo.runChatMigrations(this.buildChatMigrations());
      await this.roomRepo.ensureChatTrigger();
      this.logger.log('Chat tables ensured');
    });
  }

  private buildChatMigrations(): string[] {
    return [
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS thread_root_id TEXT`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS forward_from_id TEXT`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS content TEXT`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_url TEXT`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_name TEXT`,
      `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_type TEXT`,
      `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW()`,
      `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_read_message_id TEXT`,
      `ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0`,
      `UPDATE chat_messages SET content = text WHERE content IS NULL AND text IS NOT NULL`,
      `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS context_type TEXT`,
      `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS context_id TEXT`,
      `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0`,
      `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS last_message_id TEXT`,
      `ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
      `CREATE TABLE IF NOT EXISTS chat_message_tasks (id SERIAL PRIMARY KEY, message_id INTEGER NOT NULL, title TEXT NOT NULL, assigned_to INTEGER, due_date DATE, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT NOW())`,
      `DELETE FROM chat_members cm USING admins a JOIN users u ON u.username = a.username WHERE cm.user_id = a.id::text AND EXISTS (SELECT 1 FROM chat_members cm2 WHERE cm2.room_id = cm.room_id AND cm2.user_id = u.id::text)`,
      `UPDATE chat_members cm SET user_id = u.id::text FROM admins a JOIN users u ON u.username = a.username WHERE cm.user_id = a.id::text AND NOT EXISTS (SELECT 1 FROM chat_members cm2 WHERE cm2.room_id = cm.room_id AND cm2.user_id = u.id::text)`,
    ];
  }

  async resolveUserId(rawId: string | number): Promise<number> {
    if (typeof rawId === 'number') return rawId;
    const cached = this._userIdCache.get(rawId);
    if (cached) return cached;
    const parsed = parseInt(rawId, 10);
    if (!isNaN(parsed) && String(parsed) === rawId) {
      this._userIdCache.set(rawId, parsed);
      return parsed;
    }
    try {
      // Promise.resolve() defends against repo stubs that return undefined/void
      // (e.g. in narrow unit tests) — without it, `.catch` on undefined throws TypeError.
      const usernameResult = await Promise.resolve(this.roomRepo.findUserByAdminId(rawId))
        .catch((e: unknown) => { this.logger.debug('findUserByAdminId failed', String(e)); });
      const username = usernameResult?.ok ? usernameResult.data : null;
      if (username) {
        const numIdResult = await this.roomRepo.findUserIdByUsername(username);
        const numId = numIdResult.ok ? numIdResult.data : null;
        if (numId && !isNaN(numId)) { this._userIdCache.set(rawId, numId); return numId; }
      }
      const numId2Result = await Promise.resolve(this.roomRepo.findUserById(rawId))
        .catch((e: unknown) => { this.logger.debug('findUserById failed', String(e)); });
      const numId2 = numId2Result?.ok ? numId2Result.data : null;
      if (numId2 && !isNaN(numId2)) { this._userIdCache.set(rawId, numId2); return numId2; }
    } catch { /* Table may not exist */ }
    return 0;
  }

  getOrCreateDirectRoom(userA: number, userB: number) { return this.roomSvc.getOrCreateDirectRoom(userA, userB); }
  getOrCreateDepartmentRoom(deptId: number, deptName: string, createdBy: number) { return this.roomSvc.getOrCreateDepartmentRoom(deptId, deptName, createdBy); }
  getRoomsForUser(userId: number) { return this.roomSvc.getRoomsForUser(userId); }
  getRoomById(roomId: string | number) { return this.roomSvc.getRoomById(roomId); }
  getRoomMembers(roomId: string | number) { return this.roomSvc.getRoomMembers(roomId); }
  createGroupRoom(name: string, memberIds: number[], createdBy: number, type: 'GROUP' | 'CHANNEL' = 'GROUP') { return this.roomSvc.createGroupRoom(name, memberIds, createdBy, type); }
  addMemberToRoom(roomId: string | number, userId: number) { return this.roomSvc.addMemberToRoom(roomId, userId); }
  markRoomAsRead(roomId: string | number, userId: number) { return this.roomSvc.markRoomAsRead(roomId, userId); }
  isRoomMember(roomId: string | number, userId: number) { return this.roomSvc.isRoomMember(roomId, userId); }

  async assertRoomMember(roomId: string | number, userId: number): Promise<void> {
    const isMember = await this.roomSvc.isRoomMember(roomId, userId);
    if (!isMember) throw new ForbiddenException(await this.i18n.t('auth.permissionsDenied'));
  }
  getTotalUnreadCount(userId: number) { return this.roomSvc.getTotalUnreadCount(userId); }
  getBulkUnreadCounts(userIds: number[]) { return this.roomSvc.getBulkUnreadCounts(userIds); }
  getAllEmployees(search?: string) { return this.roomSvc.getAllEmployees(search); }
  getTodayBirthdays() { return this.roomSvc.getTodayBirthdays(); }
  toggleMemberMute(roomId: string, userId: string, muted: boolean) { return this.roomSvc.toggleMemberMute(roomId, userId, muted); }
  getOrCreateDepartmentRooms(userId: number) { return this.roomSvc.getOrCreateDepartmentRooms(userId); }
  getSharedFiles(roomId: string | number, type?: string) { return this.roomSvc.getSharedFiles(roomId, type); }

  getMessages(roomId: string | number, userId: number, limit?: number, before?: string) { return this.msgSvc.getMessages(roomId, userId, limit, before); }
  sendMessage(roomId: string | number, senderId: number, content: string, opts?: Record<string, unknown>) {
    const replyToId = opts?.replyToId != null ? Number(opts.replyToId) : undefined;
    return this.msgSvc.sendMessage(roomId, senderId, content, opts?.fileUrl as string | undefined, opts?.fileName as string | undefined, opts?.fileType as string | undefined, replyToId);
  }
  editMessage(messageId: string | number, userId: number, content: string) { return this.msgSvc.editMessage(messageId, userId, content); }
  deleteMessage(messageId: string | number, userId: number) { return this.msgSvc.deleteMessage(messageId, userId); }
  pinMessage(messageId: string | number, userId: number, pin: boolean) { return this.msgSvc.pinMessage(messageId, userId, pin); }
  getPinnedMessage(roomId: string | number) { return this.msgSvc.getPinnedMessage(roomId); }

  forwardMessage(messageId: string | number, targetRoomId: string | number, senderId: number) { return this.msgExtSvc.forwardMessage(messageId, targetRoomId, senderId); }
  getThreadMessages(rootMessageId: string | number, userId: number) { return this.msgExtSvc.getThreadMessages(rootMessageId, userId); }
  sendThreadMessage(rootMessageId: string | number, senderId: number, content: string) { return this.msgExtSvc.sendThreadMessage(rootMessageId, senderId, content); }
  uploadFileAndSendMessage(roomId: string | number, senderId: number, fileUrl: string, fileName: string, fileType: string, fileSize: number) { return this.msgExtSvc.uploadFileAndSendMessage(roomId, senderId, fileUrl, fileName, fileType, fileSize); }
  toggleReaction(messageId: string | number, userId: number, emoji: string) { return this.msgExtSvc.toggleReaction(messageId, userId, emoji); }
  removeReaction(messageId: string | number, userId: number, emoji: string) { return this.msgExtSvc.removeReaction(messageId, userId, emoji); }
  getReactions(messageId: string | number) { return this.msgExtSvc.getReactions(messageId); }
  createPoll(roomId: string | number, senderId: number, question: string, options: string[], isMultiple: boolean, isAnonymous: boolean) { return this.msgExtSvc.createPoll(roomId, senderId, question, options, isMultiple, isAnonymous); }
  votePoll(pollId: string | number, userId: number, optionIndices: number[]) { return this.msgExtSvc.votePoll(pollId, userId, optionIndices); }
}
