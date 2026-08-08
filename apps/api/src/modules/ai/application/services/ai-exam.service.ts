/**
 * @module ai-exam.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { DrizzleAiExamRepo } from '../../infrastructure/repositories/drizzle-ai-exam.repo';
import { AiExamAttempt, AiExamDetail } from '../../presentation/dto/ai-exam.dto';

@Injectable()
export class AiExamService {
  private readonly logger = new Logger(AiExamService.name);

  constructor(private readonly repo: DrizzleAiExamRepo) {}

  async getAttempts(): Promise<Result<AiExamAttempt[]>> {
    return this.repo.findAllAttempts();
  }

  async getAttemptById(id: string): Promise<Result<AiExamDetail>> {
    const result = await this.repo.findAttemptById(id);
    if (!isOk(result)) return Err(result.error);
    if (!result.data) return Err(`Urinish topilmadi: ${id}`);
    return Ok(result.data);
  }

  async assignExam(userId: string, positionId: string): Promise<Result<Record<string, unknown>>> {
    this.logger.log(`Assigning AI exam: userId=${userId}, positionId=${positionId}`);
    return this.repo.assignExam(userId, positionId);
  }

  /** Per-card AI exam (ORG Phase 4B, EP-ORG-046): scope to org_function_id + razryad; pool from hr_question_bank. */
  async assignExamToCard(userId: number, orgFunctionId: number, razryadLevelId: number | null): Promise<Result<Record<string, unknown>>> {
    this.logger.log(`Assign AI exam to card: user=${userId}, card=${orgFunctionId}, razryad=${razryadLevelId ?? '-'}`);
    return this.repo.assignExamToCard(userId, orgFunctionId, razryadLevelId);
  }

  /** All AI-exam attempts for a card (card UI). */
  async getAttemptsByCard(orgFunctionId: number): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.findAttemptsByCard(orgFunctionId);
  }

  async submitAttempt(attemptId: string, answers: Record<string, string>): Promise<Result<Record<string, unknown>>> {
    this.logger.log(`Submitting AI exam attempt: ${attemptId}`);
    return this.repo.submitAttempt(attemptId, answers);
  }

  async deleteAttempt(id: string): Promise<Result<{ message: string }>> {
    const check = await this.repo.findAttemptById(id);
    if (!isOk(check)) return Err(check.error);
    if (!check.data) return Err(`Urinish topilmadi: ${id}`);

    const result = await this.repo.deleteAttempt(id);
    if (!isOk(result)) return Err(result.error);
    return Ok({ message: 'AI imtihon urinishi o`chirildi' });
  }
}
