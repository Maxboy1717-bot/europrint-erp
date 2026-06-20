/**
 * @module chat-admin.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, isErr } from '@common/result';
import { ChatAdminRepository } from './repositories/chat-admin.repository';

// snake_case keys to match FE ChatAdminPageTypes.AdminRoom interface
export interface AdminRoom {
  id: string;
  name: string;
  type: string;
  description: string;
  member_count: number;
  message_count: number;
  is_archived: boolean;
  created_at: string;
  last_message_at: string;
  created_by_name: string;
  // camelCase aliases kept for backward compat (service internal use)
  memberCount: number;
  isArchived: boolean;
  createdAt: string;
}

export interface AdminRoomMember {
  userId: string;
  fullName: string;
  role: string;
  joinedAt: string;
}

@Injectable()
export class ChatAdminService {
  private readonly logger = new Logger(ChatAdminService.name);

  constructor(private readonly repo: ChatAdminRepository) {}

  async getAdminRooms(): Promise<Result<{ rooms: AdminRoom[] }>> {
    const result = await this.repo.findAllRooms();
    if (isErr(result)) return Err(result.error);
    return Ok({ rooms: result.data });
  }

  async getRoomMembers(roomId: string): Promise<Result<{ members: AdminRoomMember[] }>> {
    const result = await this.repo.findRoomMembers(roomId);
    if (isErr(result)) return Err(result.error);
    return Ok({ members: result.data });
  }

  async archiveRoom(roomId: string): Promise<Result<{ id: string; isArchived: boolean }>> {
    const exists = await this.repo.roomExistsById(roomId);
    if (isErr(exists)) return Err(exists.error);
    if (!exists.data) return Err(AppErr('NOT_FOUND', 'Xona topilmadi'));
    const updateResult = await this.repo.setRoomArchived(roomId);
    if (isErr(updateResult)) return Err(updateResult.error);
    return Ok({ id: roomId, isArchived: true });
  }

  async removeMember(roomId: string, userId: string): Promise<Result<{ removed: boolean }>> {
    const result = await this.repo.deleteMember(roomId, userId);
    if (isErr(result)) return Err(result.error);
    return Ok({ removed: true });
  }

  async updateMemberRole(roomId: string, userId: string, role: string): Promise<Result<{ roomId: string; userId: string; role: string }>> {
    const exists = await this.repo.memberExists(roomId, userId);
    if (isErr(exists)) return Err(exists.error);
    if (!exists.data) return Err(AppErr('NOT_FOUND', "A'zo topilmadi"));
    const updateResult = await this.repo.setMemberRole(roomId, userId, role);
    if (isErr(updateResult)) return Err(updateResult.error);
    return Ok({ roomId, userId, role });
  }

  async getAuditLogs(page: number, limit: number): Promise<Result<{ logs: unknown[]; total: number; pages: number }>> {
    const result = await this.repo.findAuditLogs(page, limit);
    if (isErr(result)) return Err(result.error);
    const { logs, total } = result.data;
    return Ok({ logs, total, pages: Math.ceil(total / limit) || 1 });
  }
}
