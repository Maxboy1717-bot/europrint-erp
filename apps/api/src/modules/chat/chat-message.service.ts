import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { ChatMessageRepository } from './repositories/chat-message.repository';

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(ChatMessageService.name);

  constructor(private readonly msgRepo: ChatMessageRepository) {}

  private buildSentMessage(
    msg: Record<string, unknown>,
    user: Record<string, unknown> | undefined,
    replyToMessage: Record<string, unknown> | null,
  ): Record<string, unknown> {
    return {
      id: String(msg['id']), roomId: String(msg['room_id']), senderId: String(msg['sender_id']),
      content: msg['content'] || msg['text'], fileUrl: msg['file_url'], fileName: msg['file_name'],
      fileType: msg['file_type'], messageType: String(msg['message_type'] ?? '').toLowerCase(),
      isDeleted: msg['is_deleted'], isEdited: msg['is_edited'], isPinned: msg['is_pinned'],
      replyToId: msg['reply_to_id'] ? String(msg['reply_to_id']) : null, replyToMessage,
      threadCount: 0, reactions: [], createdAt: msg['created_at'],
      senderName: user?.['full_name'], senderAvatar: user?.['profile_image_url'], senderEmployeeId: user?.['employee_id'],
    };
  }

  async getMessages(roomId: string | number, userId: number, limit = 50, before?: string): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      const roomIdStr = String(roomId);
      const userIdStr = String(userId);
      const isMemberResult = await this.msgRepo.checkMembership(roomIdStr, userIdStr);
      const isMember = isMemberResult.ok && isMemberResult.data;
      if (!isMember) throw new ForbiddenException('Guruh a\'zosi emassiz');
      const rowsResult = await this.msgRepo.fetchMessages(roomIdStr, userIdStr, limit, before);
      if (!rowsResult.ok) throw new Error(rowsResult.error.message);
      return (rowsResult.data as Record<string, unknown>[]).reverse();
    });
  }

  async sendMessage(
    roomId: string | number, senderId: number, content: string,
    fileUrl?: string, fileName?: string, fileType?: string, replyToId?: number,
  ): Promise<Record<string, unknown>> {
    const roomIdStr = String(roomId);
    const senderIdStr = String(senderId);
    const replyToIdStr = replyToId ? String(replyToId) : null;
    const isMemberResult = await this.msgRepo.checkMembership(roomIdStr, senderIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new Error('Not a member of this room');
    const messageType = fileUrl ? (fileType?.startsWith('image/') ? 'IMAGE' : 'FILE') : 'TEXT';
    const msgResult = await this.msgRepo.insertMessage(
      roomIdStr, senderIdStr, content || null, fileUrl || null,
      fileName || null, fileType || null, messageType, replyToIdStr,
    );
    if (!msgResult.ok) throw new Error(msgResult.error.message);
    const msg = msgResult.data as Record<string, unknown>;
    const userResult = await this.msgRepo.findUserInfo(senderId);
    const user = (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;
    let replyToMessage: Record<string, unknown> | null = null;
    if (replyToId) {
      const replyResult = await this.msgRepo.findReplyMessage(String(replyToId));
      replyToMessage = (replyResult.ok ? replyResult.data : null) as Record<string, unknown> | null;
    }
    return this.buildSentMessage(msg, user, replyToMessage);
  }

  async editMessage(messageId: string | number, userId: number, content: string): Promise<Record<string, unknown> | null> {
    return this.msgRepo.updateMessageContent(messageId, userId, content);
  }

  async deleteMessage(messageId: string | number, userId: number): Promise<Record<string, unknown> | null> {
    this.logger.log(`chat message: o'chirilmoqda`);
    return this.msgRepo.softDeleteMessage(messageId, userId);
  }

  async pinMessage(messageId: string | number, userId: number, pin: boolean): Promise<Record<string, unknown> | null> {
    const msgIdStr = String(messageId);
    const msgRowResult = await this.msgRepo.findMessageRoomId(msgIdStr);
    const msgRow = (msgRowResult.ok ? msgRowResult.data : null) as Record<string, unknown> | null;
    if (!msgRow) throw new NotFoundException(`Xabar #${messageId} topilmadi`);
    const roomId = String(msgRow['room_id']);
    const isMemberResult = await this.msgRepo.checkMembership(roomId, String(userId));
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new ForbiddenException('Bu xonaga kirishingiz yo\'q');
    await this.msgRepo.setPinned(msgIdStr, pin);
    return { messageId: msgIdStr, isPinned: pin, roomId };
  }

  async getPinnedMessage(roomId: string | number): Promise<Record<string, unknown> | null> {
    return this.msgRepo.findPinnedMessage(String(roomId));
  }

  async starMessage(messageId: string, userId: string, starred: boolean): Promise<{ starred: boolean; messageId: string }> {
    const msgResult = await this.msgRepo.findMessageRoomForStar(messageId);
    const msg = (msgResult.ok ? msgResult.data : null) as Record<string, unknown> | null;
    if (!msg) throw new NotFoundException('Xabar topilmadi');
    const isMemberResult = await this.msgRepo.checkMembershipByRoom(String(msg['room_id']), userId);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new ForbiddenException('Bu xonaga kirishingiz yo\'q');
    if (starred) {
      await this.msgRepo.starMessage(messageId, userId);
    } else {
      await this.msgRepo.unstarMessage(messageId, userId);
    }
    return { starred, messageId };
  }
}
