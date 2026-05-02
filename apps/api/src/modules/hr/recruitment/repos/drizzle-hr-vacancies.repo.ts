import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { vacancies, candidates, hrCandidateFunnels, hrFunnelHistory } from '@europrint/schemas';
import { eq, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleHrVacanciesRepository {
  async findAll(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: vacancies.id,
          title: vacancies.title,
          department: vacancies.department,
          status: vacancies.status,
          is_active: vacancies.isActive,
          created_at: vacancies.createdAt,
        })
        .from(vacancies)
        .orderBy(desc(vacancies.createdAt))
        .limit(200);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(vacancies)
        .where(eq(vacancies.id, id))
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findPipeline(vacancyId?: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: hrCandidateFunnels.id,
          candidate_id: hrCandidateFunnels.candidateId,
          vacancy_id: hrCandidateFunnels.vacancyId,
          funnel_stage: hrCandidateFunnels.funnelStage,
          is_active: hrCandidateFunnels.isActive,
          created_at: hrCandidateFunnels.createdAt,
        })
        .from(hrCandidateFunnels)
        .where(
          vacancyId
            ? eq(hrCandidateFunnels.vacancyId, vacancyId)
            : sql`true`,
        )
        .orderBy(desc(hrCandidateFunnels.createdAt))
        .limit(200);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findPipelineById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(hrCandidateFunnels)
        .where(eq(hrCandidateFunnels.id, id))
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updatePipelineStage(id: number, stage: string, _updatedBy: number): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(hrCandidateFunnels)
        .set({ funnelStage: stage })
        .where(eq(hrCandidateFunnels.id, id))
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async countByVacancy(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          vacancy_id: hrCandidateFunnels.vacancyId,
          total: sql<number>`count(*)`,
        })
        .from(hrCandidateFunnels)
        .groupBy(hrCandidateFunnels.vacancyId);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findActiveVacancies(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: vacancies.id,
          title: vacancies.title,
          department: vacancies.department,
          created_at: vacancies.createdAt,
        })
        .from(vacancies)
        .where(eq(vacancies.status, 'active'))
        .orderBy(desc(vacancies.createdAt))
        .limit(50);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findInternalBoard(): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: vacancies.id,
          title: vacancies.title,
          status: vacancies.status,
          created_at: vacancies.createdAt,
        })
        .from(vacancies)
        .where(eq(vacancies.status, 'active'))
        .orderBy(desc(vacancies.createdAt))
        .limit(100);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findCandidateCount(): Promise<Result<{ total: number }>> {
    try {
      const rows = await db
        .select({ total: sql<number>`count(*)` })
        .from(candidates);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      const total = Number(rows[0]?.total ?? 0);
      return Ok({ total });
    } catch (e) {
      return Err(String(e));
    }
  }

  async findChannelsByVacancy(vacancyId: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          source: candidates.source,
          total: sql<number>`count(*)`,
        })
        .from(candidates)
        .innerJoin(hrCandidateFunnels, eq(hrCandidateFunnels.candidateId, candidates.id))
        .where(eq(hrCandidateFunnels.vacancyId, vacancyId))
        .groupBy(candidates.source);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findRoadmapByPipeline(pipelineId: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: hrFunnelHistory.id,
          funnel_id: hrFunnelHistory.funnelId,
          from_stage: hrFunnelHistory.fromStage,
          stage: hrFunnelHistory.stage,
          created_at: hrFunnelHistory.createdAt,
          changed_by: hrFunnelHistory.changedBy,
        })
        .from(hrFunnelHistory)
        .where(eq(hrFunnelHistory.funnelId, String(pipelineId)))
        .orderBy(hrFunnelHistory.createdAt);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findProbationJournal(pipelineId: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: hrFunnelHistory.id,
          funnel_id: hrFunnelHistory.funnelId,
          from_stage: hrFunnelHistory.fromStage,
          stage: hrFunnelHistory.stage,
          created_at: hrFunnelHistory.createdAt,
          changed_by: hrFunnelHistory.changedBy,
          notes: hrFunnelHistory.notes,
        })
        .from(hrFunnelHistory)
        .where(eq(hrFunnelHistory.funnelId, String(pipelineId)))
        .orderBy(desc(hrFunnelHistory.createdAt));
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findProbationDates(pipelineId: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select({
          id: hrCandidateFunnels.id,
          created_at: hrCandidateFunnels.createdAt,
          hired_at: hrCandidateFunnels.hiredAt,
          funnel_stage: hrCandidateFunnels.funnelStage,
        })
        .from(hrCandidateFunnels)
        .where(eq(hrCandidateFunnels.id, pipelineId))
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findMarketAnalysisByVacancy(vacancyId: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select({
          vacancy_id: hrCandidateFunnels.vacancyId,
          total_candidates: sql<number>`count(distinct ${hrCandidateFunnels.candidateId})`,
        })
        .from(hrCandidateFunnels)
        .where(eq(hrCandidateFunnels.vacancyId, vacancyId))
        .groupBy(hrCandidateFunnels.vacancyId)
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async recordFunnelHistory(funnelId: string, stage: string, changedBy: string, notes?: string): Promise<Result<Row>> {
    try {
      const [row] = await db.insert(hrFunnelHistory).values({
        funnelId, stage, changedBy, fromStage: null, notes: notes ?? null,
      } as typeof hrFunnelHistory.$inferInsert).returning();
      return Ok((row ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateFunnelNotes(funnelId: number, notes: string): Promise<Result<Row>> {
    try {
      const [row] = await db.update(hrCandidateFunnels)
        .set({ notes, updatedAt: _time.now() }).where(eq(hrCandidateFunnels.id, funnelId)).returning();
      return Ok((row ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async addCandidateToFunnel(vacancyId: number, candidateId: number, note: string, source: string): Promise<Result<Row>> {
    try {
      const [row] = await db.insert(hrCandidateFunnels).values({
        candidateId, vacancyId, funnelStage: 'applied', isActive: true, source, notes: note,
      } as typeof hrCandidateFunnels.$inferInsert).returning();
      return Ok((row ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }
}
