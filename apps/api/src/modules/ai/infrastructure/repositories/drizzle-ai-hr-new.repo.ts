import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Ok, Result } from '@common/result';
import { aiHrInterviews } from '@europrint/schemas';
import { z } from 'zod';
import { CreateAiInterviewDtoSchema } from '../../presentation/dto/ai-hr-new.dto';

type CreateDto = z.infer<typeof CreateAiInterviewDtoSchema>;

export interface AiInterviewRow {
  id:            string;
  candidateId:   string;
  positionTitle: string;
  interviewType: string;
  status:        string;
  scheduledAt:   string | null;
  notes:         string | null;
  createdAt:     string;
}

@Injectable()
export class DrizzleAiHrNewRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  private toRow(r: typeof aiHrInterviews.$inferSelect): AiInterviewRow {
    return {
      id:            r.id,
      candidateId:   r.candidateId,
      positionTitle: r.positionTitle,
      interviewType: r.interviewType,
      status:        r.status,
      scheduledAt:   r.scheduledAt ?? null,
      notes:         r.notes ?? null,
      createdAt:     r.createdAt?.toISOString() ?? _time.now().toISOString(),
    };
  }

  async findInterviews(page: number, limit: number): Promise<Result<AiInterviewRow[]>> {
    const result = await safeCall(async () => {
      const offset = (page - 1) * limit;
      const rows = await this.drizzle.db
        .select()
        .from(aiHrInterviews)
        .orderBy(desc(aiHrInterviews.createdAt))
        .limit(limit)
        .offset(offset);
      return (rows ?? []).map((r) => this.toRow(r));
    });
    if (!result.ok) return Ok([]);
    return result;
  }

  async createInterview(dto: CreateDto, createdBy: string): Promise<Result<AiInterviewRow>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiHrInterviews)
        .values({
          candidateId:   dto.candidateId,
          positionTitle: dto.positionTitle,
          interviewType: dto.interviewType,
          scheduledAt:   dto.scheduledAt ?? null,
          notes:         dto.notes ?? null,
          createdBy,
        })
        .returning();
      if (!row) throw new Error('AI intervyu yaratishda xato: natija qaytmadi');
      return this.toRow(row);
    });
  }

  async findDashboardStats(): Promise<Result<Record<string, unknown>>> {
    const result = await safeCall(async () => {
      const rows = await this.drizzle.db.select().from(aiHrInterviews);
      const completed = (rows ?? []).filter((r) => r.status === 'completed').length;
      return { totalAiTasks: rows.length, completedInterviews: completed };
    });
    if (!result.ok) return Ok({ totalAiTasks: 0, completedInterviews: 0 });
    return result;
  }

  async findRecentTasks(limit: number): Promise<Result<Record<string, unknown>[]>> {
    const result = await safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiHrInterviews)
        .orderBy(desc(aiHrInterviews.createdAt))
        .limit(limit);
      return (rows ?? []).map((r) => ({ id: r.id, taskType: r.interviewType, status: r.status, createdAt: r.createdAt?.toISOString() ?? '' }));
    });
    if (!result.ok) return Ok([]);
    return result;
  }
}
