/**
 * @module chat-room.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { ChatRoomRepository } from './repositories/chat-room.repository';

@Injectable()
export class ChatRoomService {
  private readonly logger = new Logger(ChatRoomService.name);

  constructor(private readonly roomRepo: ChatRoomRepository) {}

  async getOrCreateDirectRoom(userA: number, userB: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      const userAStr = String(userA);
      const userBStr = String(userB);
      const existingResult = await this.roomRepo.findDirectRoom(userAStr, userBStr);
      if (existingResult.ok && existingResult.data) return existingResult.data;

      const roomResult = await this.roomRepo.createDirectRoom(userAStr);
      if (!roomResult.ok) throw new Error(roomResult.error.message);
      const room = roomResult.data as Record<string, unknown>;
      const roomId = String(room['id']);
      await this.roomRepo.insertMember(roomId, userAStr);
      await this.roomRepo.insertMember(roomId, userBStr);
      return room;
    });
  }

  async getOrCreateDepartmentRoom(departmentId: number, departmentName: string, createdBy: number): Promise<Record<string, unknown>> {
    const existingResult = await this.roomRepo.findDepartmentRoom(String(departmentId));
    if (existingResult.ok && existingResult.data) return existingResult.data as Record<string, unknown>;
    const roomResult = await this.roomRepo.createDepartmentRoom(departmentName, String(departmentId), String(createdBy));
    if (!roomResult.ok) throw new Error(roomResult.error.message);
    return roomResult.data as Record<string, unknown>;
  }

  async getOrCreateDepartmentRooms(userId: number): Promise<void> {
    const deptsResult = await this.roomRepo.findUserDepartments(userId);
    const depts = (deptsResult.ok ? deptsResult.data : []) as Record<string, unknown>[];
    for (const dept of depts) {
      const d = dept as Record<string, unknown>;
      const room = await this.getOrCreateDepartmentRoom(Number(d['id']), String(d['name']), userId);
      await this.addMemberToRoom(String(room['id']), userId);
    }
  }

  async getRoomsForUser(userId: number): Promise<Record<string, unknown>[]> {
    const result = await this.roomRepo.findRoomsForUser(String(userId));
    return (result.ok ? result.data : []) as Record<string, unknown>[];
  }

  async getRoomById(roomId: string | number): Promise<Record<string, unknown>> {
    const result = await this.roomRepo.findRoomById(String(roomId));
    return (result.ok ? result.data : undefined) as Record<string, unknown>;
  }

  async getRoomMembers(roomId: string | number): Promise<Record<string, unknown>[]> {
    const result = await this.roomRepo.findRoomMembers(String(roomId));
    return (result.ok ? result.data : []) as Record<string, unknown>[];
  }

  async createGroupRoom(name: string, memberIds: number[], createdBy: number, type: 'GROUP' | 'CHANNEL' = 'GROUP'): Promise<Record<string, unknown>> {
    this.logger.log(`chat room: yaratilmoqda (${type})`);
    const createdByStr = String(createdBy);
    const roomResult = await this.roomRepo.createGroupRoom(name, createdByStr, type);
    if (!roomResult.ok) throw new Error(roomResult.error.message);
    const room = roomResult.data as Record<string, unknown>;
    const roomId = String(room['id']);
    const allMembers = [...new Set([createdBy, ...memberIds])];
    for (const uid of allMembers) {
      await this.roomRepo.insertMember(roomId, String(uid), uid === createdBy ? 'ADMIN' : 'MEMBER');
    }
    return room;
  }

  async addMemberToRoom(roomId: string | number, userId: number): Promise<void> {
    await this.roomRepo.insertMember(String(roomId), String(userId));
  }

  async markRoomAsRead(roomId: string | number, userId: number): Promise<void> {
    await this.roomRepo.updateRoomReadAt(String(roomId), String(userId));
  }

  async isRoomMember(roomId: string | number, userId: number): Promise<boolean> {
    const result = await this.roomRepo.checkMembership(String(roomId), userId);
    return result.ok ? result.data : false;
  }

  async getTotalUnreadCount(userId: number): Promise<number> {
    const result = await this.roomRepo.getTotalUnread(String(userId));
    return result.ok ? result.data : 0;
  }

  async getAllEmployees(search?: string): Promise<Record<string, unknown>[]> {
    const result = await this.roomRepo.findAllEmployees(search);
    return (result.ok ? result.data : []) as Record<string, unknown>[];
  }

  async getTodayBirthdays(): Promise<Result<Record<string, unknown>[]>> {
    return this.roomRepo.findTodayBirthdays();
  }

  async toggleMemberMute(roomId: string, userId: string, muted: boolean): Promise<void> {
    await this.roomRepo.updateMemberMute(roomId, userId, muted);
  }
}
