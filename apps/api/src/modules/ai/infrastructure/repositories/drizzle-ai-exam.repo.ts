import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Result } from '@common/result';
import { aiExamAttempts } from '@europrint/schemas';
import { AiExamAttempt, AiExamDetail } from '../../presentation/dto/ai-exam.dto';

@Injectable()
export class DrizzleAiExamRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAllAttempts(): Promise<Result<AiExamAttempt[]>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiExamAttempts)
        .limit(100);
      return (rows ?? []).map((r): AiExamAttempt => ({
        id:             r.id,
        userId:         r.employeeId,
        employeeId:     r.employeeId,
        fullName:       '',
        positionName:   '',
        positionNameRu: '',
        score:          r.score,
        status:         r.status,
        startedAt:      r.createdAt?.toISOString() ?? _time.now().toISOString(),
        completedAt:    r.submittedAt?.toISOString() ?? null,
        analyzedAt:     r.analyzedAt?.toISOString() ?? null,
      }));
    });
  }

  async findAttemptById(id: string): Promise<Result<AiExamDetail | null>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .select()
        .from(aiExamAttempts)
        .where(eq(aiExamAttempts.id, id))
        .limit(1);
      if (!row) return null;
      const detail: AiExamDetail = {
        attempt: {
          id:          row.id,
          userId:      String(row.employeeId),
          positionId:  '',
          questions:   (row.questions as { id: string; question: string; category: string }[]) ?? [],
          answers:     (row.answers as Record<string, string>) ?? null,
          gptAnalysis: row.gptAnalysis ?? null,
          score:       row.score,
          evaluation:  (row.evaluation as Record<string, { comment: string; score: number; maxScore: number }>) ?? null,
          status:      row.status,
          startedAt:   row.createdAt?.toISOString() ?? '',
          completedAt: row.submittedAt?.toISOString() ?? null,
          analyzedAt:  row.analyzedAt?.toISOString() ?? null,
        },
        user:     { id: row.employeeId, employeeId: '', fullName: '', lang: 'uz' },
        position: { id: '', name: '', nameRu: null },
      };
      return detail;
    });
  }

  async assignExam(userId: string, positionId: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiExamAttempts)
        .values({ employeeId: userId, status: 'assigned', questions: [] })
        .returning();
      if (!row) throw new Error('Imtihon tayinlashda xato: natija qaytmadi');
      return { id: row.id, userId, positionId, status: 'assigned' };
    });
  }

  async submitAttempt(attemptId: string, answers: Record<string, string>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .update(aiExamAttempts)
        .set({ answers, status: 'submitted', submittedAt: _time.now() })
        .where(eq(aiExamAttempts.id, attemptId))
        .returning();
      if (!row) throw new NotFoundException(`Urinish topilmadi: ${attemptId}`);
      return { id: row.id, status: 'submitted', answerCount: Object.keys(answers).length };
    });
  }

  async deleteAttempt(id: string): Promise<Result<void>> {
    return safeCall(async () => {
      const deleted = await this.drizzle.db
        .delete(aiExamAttempts)
        .where(eq(aiExamAttempts.id, id))
        .returning({ id: aiExamAttempts.id });
      if (deleted.length === 0) throw new NotFoundException(`Urinish topilmadi: ${id}`);
    });
  }
}
