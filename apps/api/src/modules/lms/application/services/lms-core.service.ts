import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { Result, Err } from '@common/result';
import { LmsExamsRepository } from '../../infrastructure/repositories/drizzle-lms-exams.repo';
import { CreateExamDto, SubmitExamDto } from '../../presentation/dto/lms-core.dto';

@Injectable()
export class LmsCoreService {
  constructor(private readonly examsRepo: LmsExamsRepository) {}

  async getLesson(id: string): Promise<Result<Record<string, unknown>>> {
    return this.examsRepo.findLesson(id);
  }

  async listExams(userId: string): Promise<Result<object[]>> {
    return this.examsRepo.findAllExams(userId);
  }

  async createExam(dto: CreateExamDto): Promise<Result<Record<string, unknown>>> {
    return this.examsRepo.saveExam(castTo<Record<string, unknown>>(dto));
  }

  async submitExam(
    examId: string,
    userId: string,
    dto: SubmitExamDto,
  ): Promise<Result<Record<string, unknown>>> {
    if (!userId || userId === '0') return Err('Foydalanuvchi aniqlanmadi');
    return this.examsRepo.submitExam(examId, userId, dto.answers);
  }

  async getRecentActivity(userId: string): Promise<Result<object[]>> {
    if (!userId || userId === '0') return Err('Foydalanuvchi aniqlanmadi');
    return this.examsRepo.findRecentActivity(userId);
  }

  async getMyProgress(userId: string): Promise<Result<Record<string, unknown>>> {
    if (!userId || userId === '0') return Err('Foydalanuvchi aniqlanmadi');
    return this.examsRepo.findMyProgress(userId);
  }
}
