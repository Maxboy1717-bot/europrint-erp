/**
 * @module lms-misc.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { LmsMiscRepository } from '../../infrastructure/repositories/drizzle-lms-misc.repo';

@Injectable()
export class LmsMiscService {
  constructor(private readonly repo: LmsMiscRepository) {}

  async listMicroModules(): Promise<Result<object[]>> {
    return this.repo.findAllMicroModules();
  }

  async recordMicroModuleView(id: string, userId: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.recordMicroModuleView(id, userId);
  }

  async listKnowledge(query?: string): Promise<Result<object[]>> {
    return this.repo.findLmsKnowledge(query);
  }

  async saveVideoProgress(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveVideoProgress(data);
  }

  async listAchievements(userId?: string): Promise<Result<object[]>> {
    return this.repo.findAchievements(userId);
  }

  async listMentors(specialization?: string): Promise<Result<object[]>> {
    return this.repo.findMentors(specialization);
  }

  async listVideoProgress(userId: string): Promise<Result<object[]>> {
    return this.repo.findVideoProgress(userId);
  }

  async listAllProgress(): Promise<Result<object[]>> {
    return this.repo.findAllProgress();
  }

  async getProgressByUser(userId: string): Promise<Result<object[]>> {
    return this.repo.findProgressByUser(userId);
  }

  async listModules(courseId?: string): Promise<Result<object[]>> {
    return this.repo.findAllModules(courseId);
  }

  // ─── Card Mentors (EP-ORG-116) — karta-markazli mentor CRUD ───────────────────────
  async listCardMentors(cardId?: string): Promise<Result<object[]>> {
    return this.repo.findCardMentors(cardId);
  }

  async getCardMentor(id: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.findCardMentorById(id);
  }

  async assignCardMentor(data: {
    cardId: number; mentorUserId: number; courseId?: number | null; notes?: string | null; assignedBy?: number | null;
  }): Promise<Result<Record<string, unknown>>> {
    return this.repo.assignCardMentor(data);
  }

  async updateCardMentor(
    id: string,
    data: { courseId?: number | null; notes?: string | null },
  ): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateCardMentor(id, data);
  }

  async revokeCardMentor(id: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.revokeCardMentor(id);
  }

  async rateCardMentor(
    id: string,
    data: { rating?: number | null; qualificationVerified?: boolean; verifiedBy?: number | null },
  ): Promise<Result<Record<string, unknown>>> {
    return this.repo.rateCardMentor(id, data);
  }
}
