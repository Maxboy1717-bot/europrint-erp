/**
 * @module lms-tests.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { Result } from '@common/result';
import { LmsTestsRepository } from '../../infrastructure/repositories/drizzle-lms-tests.repo';
import {
  CreateTestDto, UpdateTestDto,
  CreateQuestionDto, UpdateQuestionDto,
  CreateAssignmentDto,
} from '../../presentation/dto/lms-tests.dto';

const PRIVILEGED_ROLES = new Set([
  'hr_manager', 'training_officer', 'super_admin', 'director', 'hr_specialist',
]);

function isPrivileged(role: string): boolean {
  return PRIVILEGED_ROLES.has(role.toLowerCase());
}

@Injectable()
export class LmsTestsService {
  constructor(private readonly repo: LmsTestsRepository) {}

  async listTests(courseId?: string): Promise<Result<object[]>> {
    return this.repo.findAllTests(courseId);
  }

  async createTest(dto: CreateTestDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveTest(castTo<Record<string, unknown>>(dto));
  }

  async getTest(id: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.findTestById(id);
  }

  async updateTest(id: string, dto: UpdateTestDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateTest(id, castTo<Record<string, unknown>>(dto));
  }

  async deleteTest(id: string): Promise<Result<void>> {
    return this.repo.deleteTest(id);
  }

  async listQuestions(testId?: string): Promise<Result<object[]>> {
    return this.repo.findAllQuestions(testId);
  }

  async createQuestion(dto: CreateQuestionDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveQuestion(castTo<Record<string, unknown>>(dto));
  }

  async getQuestion(id: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.findQuestionById(id);
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto): Promise<Result<Record<string, unknown>>> {
    return this.repo.updateQuestion(id, castTo<Record<string, unknown>>(dto));
  }

  async deleteQuestion(id: string): Promise<Result<void>> {
    return this.repo.deleteQuestion(id);
  }

  async createAssignment(dto: CreateAssignmentDto, userId: string): Promise<Result<Record<string, unknown>>> {
    return this.repo.saveAssignment(castTo<Record<string, unknown>>(dto), userId);
  }

  async listAttempts(
    filters: { status?: string; page: number; limit: number },
    user: { id: number; role: string },
  ): Promise<Result<{ items: unknown[]; total: number }>> {
    const employeeId = isPrivileged(user.role) ? undefined : String(user.id);
    return this.repo.findAllAttempts({ ...filters, employeeId });
  }

  async listRetakeAttempts(): Promise<Result<object[]>> {
    return this.repo.findRetakeAttempts();
  }
}
