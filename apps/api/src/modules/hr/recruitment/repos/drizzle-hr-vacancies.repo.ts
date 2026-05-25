/**
 * @module drizzle-hr-vacancies.repo
 * @description Repository / data-access layer facade. Wraps Drizzle ORM queries;
 *   returns Result<T>.
 *
 *   The funnel / pipeline / probation / market-analysis surface is delegated to
 *   `DrizzleHrVacanciesFunnelRepository` so this file stays under 300 lines
 *   (Rule 16). The public method surface is unchanged so the only consumer
 *   (`hr-vacancies.service`) needs no edits.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { vacancies } from '@europrint/schemas';
import { eq, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { DrizzleHrVacanciesFunnelRepository } from './drizzle-hr-vacancies-funnel.repo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleHrVacanciesRepository {
  constructor(private readonly funnel: DrizzleHrVacanciesFunnelRepository) {}

  // ─── Vacancy CRUD (kept here) ─────────────────────────────────────────────

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

  // ─── Funnel / pipeline / probation / market-analysis (delegated) ──────────

  findPipeline(vacancyId?: number): Promise<Result<Row[]>> {
    return this.funnel.findPipeline(vacancyId);
  }

  findPipelineById(id: number): Promise<Result<Row | null>> {
    return this.funnel.findPipelineById(id);
  }

  updatePipelineStage(id: number, stage: string, updatedBy: number): Promise<Result<Row>> {
    return this.funnel.updatePipelineStage(id, stage, updatedBy);
  }

  countByVacancy(): Promise<Result<Row[]>> {
    return this.funnel.countByVacancy();
  }

  findCandidateCount(): Promise<Result<{ total: number }>> {
    return this.funnel.findCandidateCount();
  }

  findChannelsByVacancy(vacancyId: number): Promise<Result<Row[]>> {
    return this.funnel.findChannelsByVacancy(vacancyId);
  }

  findRoadmapByPipeline(pipelineId: number): Promise<Result<Row[]>> {
    return this.funnel.findRoadmapByPipeline(pipelineId);
  }

  findProbationJournal(pipelineId: number): Promise<Result<Row[]>> {
    return this.funnel.findProbationJournal(pipelineId);
  }

  findProbationDates(pipelineId: number): Promise<Result<Row | null>> {
    return this.funnel.findProbationDates(pipelineId);
  }

  findMarketAnalysisByVacancy(vacancyId: number): Promise<Result<Row | null>> {
    return this.funnel.findMarketAnalysisByVacancy(vacancyId);
  }

  recordFunnelHistory(funnelId: string, stage: string, changedBy: string, notes?: string): Promise<Result<Row>> {
    return this.funnel.recordFunnelHistory(funnelId, stage, changedBy, notes);
  }

  updateFunnelNotes(funnelId: number, notes: string): Promise<Result<Row>> {
    return this.funnel.updateFunnelNotes(funnelId, notes);
  }

  addCandidateToFunnel(vacancyId: number | null, candidateId: number, note: string, source: string): Promise<Result<Row>> {
    return this.funnel.addCandidateToFunnel(vacancyId, candidateId, note, source);
  }
}
