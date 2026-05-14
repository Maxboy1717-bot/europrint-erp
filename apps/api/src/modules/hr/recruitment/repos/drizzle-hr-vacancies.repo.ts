/**
 * @module drizzle-hr-vacancies.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db, rawSql } from '@shared/db';
import { vacancies, candidates, hrCandidateFunnels, hrFunnelHistory } from '@europrint/schemas';
import { eq, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { dbRows } from '../../common/db-rows';

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
          source: hrCandidateFunnels.source,
          screening_score: hrCandidateFunnels.screeningScore,
          // Candidate details joined
          candidate_name: sql<string>`COALESCE(${candidates.full_name}, NULLIF(TRIM(COALESCE(${candidates.first_name},'') || ' ' || COALESCE(${candidates.last_name},'')), ''), '')`,
          candidate_phone: candidates.phone,
          candidate_email: candidates.email,
          candidate_source: candidates.source,
          // Vacancy details joined
          vacancy_title: vacancies.title,
        })
        .from(hrCandidateFunnels)
        .leftJoin(candidates, eq(hrCandidateFunnels.candidateId, candidates.id))
        .leftJoin(vacancies, eq(hrCandidateFunnels.vacancyId, vacancies.id))
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
      const r = await rawSql(sql`
        UPDATE hr_candidate_funnels
        SET funnel_stage = ${stage}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, funnel_stage, candidate_id, vacancy_id, updated_at
      `);
      const row = dbRows(r)[0];
      return Ok((row ?? {}) as Row);
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
      const r = await rawSql(sql`
        UPDATE hr_candidate_funnels
        SET initial_screening_notes = ${notes}, updated_at = NOW()
        WHERE id = ${funnelId}
        RETURNING id, funnel_stage, initial_screening_notes, updated_at
      `);
      const row = dbRows(r)[0];
      return Ok((row ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async addCandidateToFunnel(vacancyId: number | null, candidateId: number, note: string, source: string): Promise<Result<Row>> {
    try {
      // Normalize source to uppercase enum value; fall back to OTHER
      const validSources = ['HH_UZ','OLX_UZ','TELEGRAM','INSTAGRAM','FACEBOOK','LINKEDIN','REFERRAL','PRINT','WEBSITE','OTHER'];
      const safeSource = validSources.includes((source ?? '').toUpperCase())
        ? source.toUpperCase()
        : 'OTHER';
      const r = await rawSql(sql`
        INSERT INTO hr_candidate_funnels
          (candidate_id, vacancy_id, funnel_stage, is_active, source, initial_screening_notes)
        VALUES
          (${candidateId}, ${vacancyId}, 'NEW', true, ${safeSource}, ${note || null})
        ON CONFLICT DO NOTHING
        RETURNING id, candidate_id, vacancy_id, funnel_stage, is_active, source, created_at
      `);
      const row = dbRows(r)[0];
      return Ok((row ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }
}
