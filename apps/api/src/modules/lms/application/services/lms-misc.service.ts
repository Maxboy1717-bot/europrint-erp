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
}
