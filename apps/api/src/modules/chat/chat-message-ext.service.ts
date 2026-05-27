/**
 * @module chat-message-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, InternalServerErrorException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, AppErr, safeCall, Err, Ok } from '@common/result';
import { ChatMessageRepository } from './repositories/chat-message.repository';

@Injectable()
export class ChatMessageExtService {
  private readonly logger = new Logger(ChatMessageExtService.name);

  constructor(
    private readonly msgRepo: ChatMessageRepository,
    private readonly i18n: I18nService,
  ) {}

  async forwardMessage(messageId: string | number, targetRoomId: string | number, senderId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`Chat xabar kengaytirilgan operatsiya bajarilmoqda`);
      const msgIdStr = String(messageId);
      const targetRoomIdStr = String(targetRoomId);
      const senderIdStr = String(senderId);

      const orig = await this.loadOriginalMessage(msgIdStr);
      await this.assertMembership(targetRoomIdStr, senderIdStr, 'Not a member of target room');

      const msgResult = await this.msgRepo.insertForwardedMessage(targetRoomIdStr, senderIdStr, orig, msgIdStr);
      if (!msgResult.ok) throw new InternalServerErrorException(msgResult.error.message);
      const msg = msgResult.data as Record<string, unknown>;
      const user = await this.findUserInfoOrUndef(senderId);
      return this.buildForwardedResult(msg, orig, msgIdStr, user);
    });
  }

  private async loadOriginalMessage(msgIdStr: string): Promise<Record<string, unknown>> {
    const origResult = await this.msgRepo.findMessageForForward(msgIdStr);
    if (!origResult.ok) throw new InternalServerErrorException(origResult.error.message);
    const orig = origResult.data as Record<string, unknown> | null;
    if (!orig) throw new InternalServerErrorException('Message not found');
    return orig;
  }

  private async assertMembership(roomId: string, userId: string, errMsg: string): Promise<void> {
    const isMemberResult = await this.msgRepo.checkMembership(roomId, userId);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) throw new InternalServerErrorException(errMsg);
  }

  private async findUserInfoOrUndef(senderId: number): Promise<Record<string, unknown> | undefined> {
    const userResult = await this.msgRepo.findUserInfo(senderId);
    return (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;
  }

  private buildForwardedResult(
    msg: Record<string, unknown>,
    orig: Record<string, unknown>,
    msgIdStr: string,
    user: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    return {
      id: String(msg['id']), roomId: String(msg['room_id']), senderId: String(msg['sender_id']),
      content: msg['content'] || msg['text'], fileUrl: msg['file_url'], fileName: msg['file_name'],
      fileType: msg['file_type'], messageType: String(msg['message_type'] ?? '').toLowerCase(),
      isDeleted: false, forwardFromId: msgIdStr,
      forwardFrom: { id: msgIdStr, senderName: orig['senderName'], content: orig['msg_content'] },
      createdAt: msg['created_at'], senderName: user?.['full_name'],
      senderAvatar: user?.['profile_image_url'], senderEmployeeId: user?.['employee_id'], reactions: [],
    };
  }

  async getThreadMessages(rootMessageId: string | number, userId: number): Promise<Result<Record<string, unknown>[], AppError>> {
    const rootMsgIdStr = String(rootMessageId);
    const userIdStr = String(userId);

    const rootRowResult = await this.msgRepo.findRootMessageRoomId(rootMsgIdStr);
    const rootRow = (rootRowResult.ok ? rootRowResult.data : null) as Record<string, unknown> | null;
    if (!rootRow) return Err(AppErr('NOT_FOUND', `Root xabar #${rootMessageId} topilmadi`));
    const roomId = String(rootRow['room_id']);

    const isMemberResult = await this.msgRepo.checkMembership(roomId, userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) return Err(AppErr('FORBIDDEN', await this.i18n.t('errors.notGroupMember')));

    const rowsResult = await this.msgRepo.findThreadMessages(rootMsgIdStr);
    const rows = (rowsResult.ok ? rowsResult.data : []) as Record<string, unknown>[];
    const mapped = (Array.isArray(rows) ? rows : []).map((m) => ({
      ...m, id: String(m['id']), roomId: String(m['roomId']),
      senderId: String(m['senderId']), threadRootId: String(m['threadRootId']),
    }));
    return Ok(mapped);
  }

  async sendThreadMessage(rootMessageId: string | number, senderId: number, content: string): Promise<Result<Record<string, unknown>, AppError>> {
    const rootMsgIdStr = String(rootMessageId);
    const senderIdStr = String(senderId);

    const roomIdResult = await this.resolveThreadRoomId(rootMsgIdStr);
    if (!roomIdResult.ok) return Err(roomIdResult.error);
    const roomId = roomIdResult.data;

    const isMemberResult = await this.msgRepo.checkMembership(String(roomId), senderIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) return Err(AppErr('FORBIDDEN', 'Not a member'));

    const msgResult = await this.msgRepo.insertThreadMessage(roomId, senderIdStr, content, rootMsgIdStr);
    if (!msgResult.ok) return Err(msgResult.error);
    const msg = msgResult.data as Record<string, unknown>;

    await this.msgRepo.incrementThreadCount(rootMsgIdStr);
    const threadCountResult = await this.msgRepo.countThreadMessages(rootMsgIdStr);
    const threadCount = threadCountResult.ok ? threadCountResult.data : 0;
    const user = await this.findUserInfoOrUndef(senderId);

    return Ok({
      msg: {
        id: String(msg['id']), roomId: String(roomId), senderId: senderIdStr,
        content: msg['content'] || msg['text'], messageType: 'text' as const,
        isDeleted: false, threadRootId: rootMsgIdStr, createdAt: msg['created_at'],
        senderName: user?.['full_name'], senderAvatar: user?.['profile_image_url'],
      },
      threadCount, rootMessageId: rootMsgIdStr, roomId: String(roomId),
    });
  }

  private async resolveThreadRoomId(rootMsgIdStr: string): Promise<Result<unknown, AppError>> {
    const rootRowResult = await this.msgRepo.findRootMessageRoomId(rootMsgIdStr, true);
    const rootRow = (rootRowResult.ok ? rootRowResult.data : null) as Record<string, unknown> | null;
    if (!rootRow) return Err(AppErr('NOT_FOUND', 'Root message not found'));
    return Ok(rootRow['room_id']);
  }

  async uploadFileAndSendMessage(
    roomId: string | number, senderId: number, fileUrl: string,
    fileName: string, fileType: string, fileSize: number,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    const roomIdStr = String(roomId);
    const senderIdStr = String(senderId);

    const isMemberResult = await this.msgRepo.checkMembership(roomIdStr, senderIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) return Err(AppErr('FORBIDDEN', 'Not a member'));

    const messageType = fileType.startsWith('image/') ? 'IMAGE' : 'FILE';
    const msgResult = await this.msgRepo.insertFileMessage(roomIdStr, senderIdStr, fileName, fileUrl, fileType, messageType);
    if (!msgResult.ok) return Err(msgResult.error);
    const msg = msgResult.data as Record<string, unknown>;

    const userResult = await this.msgRepo.findUserInfo(senderId);
    const user = (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;

    return Ok({
      id: String(msg['id']), roomId: String(msg['room_id']), senderId: String(msg['sender_id']),
      content: fileName, fileUrl, fileName, fileType, fileSize, messageType,
      isDeleted: false, createdAt: msg['created_at'],
      senderName: user?.['full_name'], senderAvatar: user?.['profile_image_url'], senderEmployeeId: user?.['employee_id'], reactions: [],
    });
  }

  async toggleReaction(messageId: string | number, userId: number, emoji: string): Promise<Result<Record<string, unknown>[], AppError>> {
    const msgIdStr = String(messageId);
    const userIdStr = String(userId);

    const msgRowResult = await this.msgRepo.findMessageRoomForReaction(msgIdStr);
    const msgRow = (msgRowResult.ok ? msgRowResult.data : null) as Record<string, unknown> | null;
    if (!msgRow) return Err(AppErr('NOT_FOUND', `Xabar #${messageId} topilmadi`));
    const roomId = String(msgRow['room_id']);

    const isMemberResult = await this.msgRepo.checkMembership(roomId, userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) return Err(AppErr('FORBIDDEN', await this.i18n.t('errors.notGroupMember')));

    const hasReactionResult = await this.msgRepo.findReaction(msgIdStr, userIdStr, emoji);
    const hasReaction = hasReactionResult.ok && hasReactionResult.data;
    if (hasReaction) {
      await this.msgRepo.deleteReaction(msgIdStr, userIdStr, emoji);
    } else {
      await this.msgRepo.insertReaction(msgIdStr, userIdStr, emoji);
    }
    return Ok(await this.getReactions(messageId));
  }

  async getReactions(messageId: string | number): Promise<Record<string, unknown>[]> {
    const r = await this.msgRepo.findReactions(String(messageId));
    return r.ok ? r.data : [];
  }

  async createPoll(
    roomId: string | number, senderId: number, question: string,
    options: string[], isMultiple: boolean, isAnonymous: boolean,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    const roomIdStr = String(roomId);
    const senderIdStr = String(senderId);

    const isMemberResult = await this.msgRepo.checkMembership(roomIdStr, senderIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) return Err(AppErr('FORBIDDEN', 'Not a member of this room'));

    const optionsJson = JSON.stringify((Array.isArray(options) ? options : []).map((o) => ({ text: o })));
    const msgResult = await this.msgRepo.insertPollMessage(roomIdStr, senderIdStr, question);
    if (!msgResult.ok) return Err(msgResult.error);
    const msg = msgResult.data as Record<string, unknown>;
    const msgIdStr = String(msg['id']);

    const pollResult = await this.msgRepo.insertPoll(msgIdStr, question, optionsJson, isMultiple, isAnonymous);
    if (!pollResult.ok) return Err(pollResult.error);
    const poll = pollResult.data as Record<string, unknown>;

    const userResult = await this.msgRepo.findUserInfo(senderId);
    const user = (userResult.ok ? userResult.data : undefined) as Record<string, unknown> | undefined;

    return Ok({
      id: msgIdStr, roomId: String(msg['room_id']), senderId: String(msg['sender_id']),
      content: question, messageType: 'poll' as const, isDeleted: false,
      createdAt: msg['created_at'], senderName: user?.['full_name'],
      senderAvatar: user?.['profile_image_url'], senderEmployeeId: user?.['employee_id'],
      reactions: [],
      poll: {
        id: String(poll['id']), question: poll['question'], options: poll['options'],
        isMultiple: poll['is_multiple'], isAnonymous: poll['is_anonymous'], votes: {}, myVotes: [], totalVotes: 0,
      },
    });
  }

  async removeReaction(messageId: string | number, userId: number, emoji: string): Promise<Result<Record<string, unknown>[], AppError>> {
    const msgIdStr = String(messageId);
    const userIdStr = String(userId);

    const msgRowResult = await this.msgRepo.findMessageRoomForReaction(msgIdStr);
    const msgRow = (msgRowResult.ok ? msgRowResult.data : null) as Record<string, unknown> | null;
    if (!msgRow) return Err(AppErr('NOT_FOUND', `Xabar #${messageId} topilmadi`));
    const roomId = String(msgRow['room_id']);

    const isMemberResult = await this.msgRepo.checkMembership(roomId, userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) return Err(AppErr('FORBIDDEN', await this.i18n.t('errors.notGroupMember')));
    await this.msgRepo.deleteReaction(msgIdStr, userIdStr, emoji);
    return Ok(await this.getReactions(messageId));
  }

  async votePoll(pollId: string | number, userId: number, optionIndices: number[]): Promise<Result<Record<string, unknown>, AppError>> {
    const pollIdStr = String(pollId);
    const userIdStr = String(userId);

    const pollResult = await this.loadAndValidatePoll(pollIdStr, userIdStr, optionIndices);
    if (!pollResult.ok) return Err(pollResult.error);
    const poll = pollResult.data;

    await this.replaceVotes(pollIdStr, userIdStr, optionIndices);

    const votes = await this.fetchPollVotes(pollIdStr);
    const voteCounts = this.tallyVotes(votes, poll['is_anonymous'] as boolean | undefined);
    return Ok({
      pollId: pollIdStr, messageId: String(poll['message_id']), roomId: String(poll['room_id']),
      votes: voteCounts, totalVotes: votes.length, myVotes: optionIndices, userId: userIdStr,
    });
  }

  private async loadAndValidatePoll(pollIdStr: string, userIdStr: string, optionIndices: number[]): Promise<Result<Record<string, unknown>, AppError>> {
    const pollResult = await this.msgRepo.findPollWithRoom(pollIdStr);
    const poll = (pollResult.ok ? pollResult.data : null) as Record<string, unknown> | null;
    if (!poll) return Err(AppErr('NOT_FOUND', 'Poll not found'));

    const isMemberResult = await this.msgRepo.checkMembership(String(poll['room_id']), userIdStr);
    const isMember = isMemberResult.ok && isMemberResult.data;
    if (!isMember) return Err(AppErr('FORBIDDEN', await this.i18n.t('errors.notPollRoomMember')));
    if (!poll['is_multiple'] && optionIndices.length > 1) return Err(AppErr('BAD_REQUEST', 'This poll allows only one vote'));
    return Ok(poll);
  }

  private async replaceVotes(pollIdStr: string, userIdStr: string, optionIndices: number[]): Promise<void> {
    await this.msgRepo.deletePollVotes(pollIdStr, userIdStr);
    for (const idx of optionIndices) {
      await this.msgRepo.insertPollVote(pollIdStr, userIdStr, idx);
    }
  }

  private async fetchPollVotes(pollIdStr: string): Promise<Record<string, unknown>[]> {
    const votesResult = await this.msgRepo.findPollVotes(pollIdStr);
    return (votesResult.ok ? votesResult.data : []) as Record<string, unknown>[];
  }

  private tallyVotes(votes: Record<string, unknown>[], isAnonymous: boolean | undefined): Record<number, { count: number; users: string[] }> {
    const voteCounts: Record<number, { count: number; users: string[] }> = {};
    for (const v of votes) {
      const idx = Number(v['option_index']);
      if (!voteCounts[idx]) voteCounts[idx] = { count: 0, users: [] };
      voteCounts[idx].count++;
      if (!isAnonymous) voteCounts[idx].users.push(String(v['full_name'] || 'Unknown'));
    }
    return voteCounts;
  }
}
