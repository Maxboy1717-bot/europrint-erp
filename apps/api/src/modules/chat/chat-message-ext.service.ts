/**
 * @module chat-message-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, InternalServerErrorException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { ChatMessageRepository } from './repositories/chat-message.repository';

@Injectable()
export class ChatMessageExtService {
  private readonly logger = new Logger(ChatMessageExtService.name);

  constructor(private readonly msgRepo: ChatMessageRepository) {}

  async forwardMessage(messageId: string | number, targetRoomId: string | number, senderId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`Chat xabar kengaytirilgan operatsiya bajarilmoqda`);
      const msgIdStr = String(messageId);
      const targetRoomIdStr = String(targetRoomId);
      const senderIdStr = String(senderId);

      const origResult = await this.msgRepo.findMessageForForward(msgIdStr);
      if (!origResult.ok) throw new Error(origResult.error.message);
      const orig = origResult.data as Record<string, unknown> | null;
      if (!orig) throw new InternalServerErrorException('Message not found');

      const isMemberResult = await this.msgRepo.checkMembership(targetRoomIdStr, senderIdStr);
      const isMember = isMemberResult.ok && isMemberResult.data;
      if (!isMember) throw new InternalServerErrorException('Not a member of target room');

      const msgResult = await this.msgRepo.insertForwardedMessage(targetRoomIdStr, senderIdStr, orig, msgIdStr);
      if (!msgResult.ok) throw new Error(msgResult.error.message);
      const msg = msgResult.data as Record<string, unknown>;

      const userResult = await this.msgRepo.findUserInfo(senderId);
      const user = (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;

      return {
        id: String(msg['id']), roomId: String(msg['room_id']), senderId: String(msg['sender_id']),
        content: msg['content'] || msg['text'], fileUrl: msg['file_url'], fileName: msg['file_name'],
        fileType: msg['file_type'], messageType: String(msg['message_type'] ?? '').toLowerCase(),
        isDeleted: false, forwardFromId: msgIdStr,
        forwardFrom: { id: msgIdStr, senderName: orig['senderName'], content: orig['msg_content'] },
        createdAt: msg['created_at'], senderName: user?.['full_name'],
        senderAvatar: user?.['profile_image_url'], senderEmployeeId: user?.['employee_id'], reactions: [],
      };
    });
  }

  async getThreadMessages(rootMessageId: string | number, userId: number): Promise<Record<string, unknown>[]> {
    const rootMsgIdStr = String(rootMessageId);
    const userIdStr = String(userId);

    const rootRowResult = await this.msgRepo.findRootMessageRoomId(rootMsgIdStr);
    const rootRow = (rootRowResult.ok ? rootRowResult.data : null) as Record<string, unknown> | null;
    if (!rootRow) throw new NotFoundException(`Root xabar #${rootMessageId} topilmadi`);
    const roomId = String(rootRow['room_id']);

    const isMemberResult = await this.msgRepo.checkMembership(roomId, userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new ForbiddenException('Guruh a\'zosi emassiz');

    const rowsResult = await this.msgRepo.findThreadMessages(rootMsgIdStr);
    const rows = (rowsResult.ok ? rowsResult.data : []) as Record<string, unknown>[];
    return (Array.isArray(rows) ? rows : []).map((m) => ({
      ...m, id: String(m['id']), roomId: String(m['roomId']),
      senderId: String(m['senderId']), threadRootId: String(m['threadRootId']),
    }));
  }

  async sendThreadMessage(rootMessageId: string | number, senderId: number, content: string): Promise<Record<string, unknown>> {
    const rootMsgIdStr = String(rootMessageId);
    const senderIdStr = String(senderId);

    const rootRowResult = await this.msgRepo.findRootMessageRoomId(rootMsgIdStr, true);
    const rootRow = (rootRowResult.ok ? rootRowResult.data : null) as Record<string, unknown> | null;
    if (!rootRow) throw new InternalServerErrorException('Root message not found');
    const roomId = rootRow['room_id'];

    const isMemberResult = await this.msgRepo.checkMembership(String(roomId), senderIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new InternalServerErrorException('Not a member');

    const msgResult = await this.msgRepo.insertThreadMessage(roomId, senderIdStr, content, rootMsgIdStr);
    if (!msgResult.ok) throw new Error(msgResult.error.message);
    const msg = msgResult.data as Record<string, unknown>;

    await this.msgRepo.incrementThreadCount(rootMsgIdStr);
    const threadCountResult = await this.msgRepo.countThreadMessages(rootMsgIdStr);
    const threadCount = threadCountResult.ok ? threadCountResult.data : 0;

    const userResult = await this.msgRepo.findUserInfo(senderId);
    const user = (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;

    return {
      msg: {
        id: String(msg['id']), roomId: String(roomId), senderId: senderIdStr,
        content: msg['content'] || msg['text'], messageType: 'text' as const,
        isDeleted: false, threadRootId: rootMsgIdStr, createdAt: msg['created_at'],
        senderName: user?.['full_name'], senderAvatar: user?.['profile_image_url'],
      },
      threadCount, rootMessageId: rootMsgIdStr, roomId: String(roomId),
    };
  }

  async uploadFileAndSendMessage(
    roomId: string | number, senderId: number, fileUrl: string,
    fileName: string, fileType: string, fileSize: number,
  ): Promise<Record<string, unknown>> {
    const roomIdStr = String(roomId);
    const senderIdStr = String(senderId);

    const isMemberResult = await this.msgRepo.checkMembership(roomIdStr, senderIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new InternalServerErrorException('Not a member');

    const messageType = fileType.startsWith('image/') ? 'IMAGE' : 'FILE';
    const msgResult = await this.msgRepo.insertFileMessage(roomIdStr, senderIdStr, fileName, fileUrl, fileType, messageType);
    if (!msgResult.ok) throw new Error(msgResult.error.message);
    const msg = msgResult.data as Record<string, unknown>;

    const userResult = await this.msgRepo.findUserInfo(senderId);
    const user = (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;

    return {
      id: String(msg['id']), roomId: String(msg['room_id']), senderId: String(msg['sender_id']),
      content: fileName, fileUrl, fileName, fileType, fileSize, messageType,
      isDeleted: false, createdAt: msg['created_at'],
      senderName: user?.['full_name'], senderAvatar: user?.['profile_image_url'], senderEmployeeId: user?.['employee_id'], reactions: [],
    };
  }

  async toggleReaction(messageId: string | number, userId: number, emoji: string): Promise<Record<string, unknown>[]> {
    const msgIdStr = String(messageId);
    const userIdStr = String(userId);

    const msgRowResult = await this.msgRepo.findMessageRoomForReaction(msgIdStr);
    const msgRow = (msgRowResult.ok ? msgRowResult.data : null) as Record<string, unknown> | null;
    if (!msgRow) throw new NotFoundException(`Xabar #${messageId} topilmadi`);
    const roomId = String(msgRow['room_id']);

    const isMemberResult = await this.msgRepo.checkMembership(roomId, userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new ForbiddenException('Guruh a\'zosi emassiz');

    const hasReactionResult = await this.msgRepo.findReaction(msgIdStr, userIdStr, emoji);
    const hasReaction = hasReactionResult.ok && hasReactionResult.data;
    if (hasReaction) {
      await this.msgRepo.deleteReaction(msgIdStr, userIdStr, emoji);
    } else {
      await this.msgRepo.insertReaction(msgIdStr, userIdStr, emoji);
    }
    return this.getReactions(messageId);
  }

  async getReactions(messageId: string | number): Promise<Record<string, unknown>[]> {
    const r = await this.msgRepo.findReactions(String(messageId));
    return r.ok ? r.data : [];
  }

  async createPoll(
    roomId: string | number, senderId: number, question: string,
    options: string[], isMultiple: boolean, isAnonymous: boolean,
  ): Promise<Record<string, unknown>> {
    const roomIdStr = String(roomId);
    const senderIdStr = String(senderId);

    const isMemberResult = await this.msgRepo.checkMembership(roomIdStr, senderIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new InternalServerErrorException('Not a member of this room');

    const optionsJson = JSON.stringify((Array.isArray(options) ? options : []).map((o) => ({ text: o })));
    const msgResult = await this.msgRepo.insertPollMessage(roomIdStr, senderIdStr, question);
    if (!msgResult.ok) throw new Error(msgResult.error.message);
    const msg = msgResult.data as Record<string, unknown>;
    const msgIdStr = String(msg['id']);

    const pollResult = await this.msgRepo.insertPoll(msgIdStr, question, optionsJson, isMultiple, isAnonymous);
    if (!pollResult.ok) throw new Error(pollResult.error.message);
    const poll = pollResult.data as Record<string, unknown>;

    const userResult = await this.msgRepo.findUserInfo(senderId);
    const user = (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;

    return {
      id: msgIdStr, roomId: String(msg['room_id']), senderId: String(msg['sender_id']),
      content: question, messageType: 'poll' as const, isDeleted: false,
      createdAt: msg['created_at'], senderName: user?.['full_name'],
      senderAvatar: user?.['profile_image_url'], senderEmployeeId: user?.['employee_id'],
      reactions: [],
      poll: {
        id: String(poll['id']), question: poll['question'], options: poll['options'],
        isMultiple: poll['is_multiple'], isAnonymous: poll['is_anonymous'], votes: {}, myVotes: [], totalVotes: 0,
      },
    };
  }

  async removeReaction(messageId: string | number, userId: number, emoji: string): Promise<Record<string, unknown>[]> {
    const msgIdStr = String(messageId);
    const userIdStr = String(userId);

    const msgRowResult = await this.msgRepo.findMessageRoomForReaction(msgIdStr);
    const msgRow = (msgRowResult.ok ? msgRowResult.data : null) as Record<string, unknown> | null;
    if (!msgRow) throw new NotFoundException(`Xabar #${messageId} topilmadi`);
    const roomId = String(msgRow['room_id']);

    const isMemberResult = await this.msgRepo.checkMembership(roomId, userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new ForbiddenException('Guruh a\'zosi emassiz');
    await this.msgRepo.deleteReaction(msgIdStr, userIdStr, emoji);
    return this.getReactions(messageId);
  }

  async votePoll(pollId: string | number, userId: number, optionIndices: number[]): Promise<Record<string, unknown>> {
    const pollIdStr = String(pollId);
    const userIdStr = String(userId);

    const pollResult = await this.msgRepo.findPollWithRoom(pollIdStr);
    const poll = (pollResult.ok ? pollResult.data : null) as Record<string, unknown> | null;
    if (!poll) throw new InternalServerErrorException('Poll not found');

    const isMemberResult = await this.msgRepo.checkMembership(String(poll['room_id']), userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new ForbiddenException('Bu pollga ovoz berish uchun xona a\'zosi bo\'lishingiz kerak');

    if (!poll['is_multiple'] && optionIndices.length > 1) throw new InternalServerErrorException('This poll allows only one vote');

    await this.msgRepo.deletePollVotes(pollIdStr, userIdStr);
    for (const idx of optionIndices) {
      await this.msgRepo.insertPollVote(pollIdStr, userIdStr, idx);
    }

    const votesResult = await this.msgRepo.findPollVotes(pollIdStr);
    const votes = (votesResult.ok ? votesResult.data : []) as Record<string, unknown>[];
    const voteCounts: Record<number, { count: number; users: string[] }> = {};
    for (const v of votes) {
      const idx = v['option_index'];
      if (!voteCounts[Number(idx)]) voteCounts[Number(idx)] = { count: 0, users: [] };
      voteCounts[Number(idx)].count++;
      if (!poll['is_anonymous']) voteCounts[Number(idx)].users.push(String(v['full_name'] || 'Unknown'));
    }
    return {
      pollId: pollIdStr, messageId: String(poll['message_id']), roomId: String(poll['room_id']),
      votes: voteCounts, totalVotes: votes.length, myVotes: optionIndices, userId: userIdStr,
    };
  }
}
