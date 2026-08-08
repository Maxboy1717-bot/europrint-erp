/**
 * @module drizzle-hr-vacancies-funnel.repo
 * @description Funnel / pipeline / probation / market-analysis sub-repository
 *   — split out of `DrizzleHrVacanciesRepository` to keep individual files
 *   under 300 lines (Rule 16). Public method names preserved; the parent
 *   repo delegates.
 */

import { Injectable } from '@nestjs/common';
import { db, rawSql } from '@shared/db';
import { vacancies, candidates, hrCandidateFunnels, hrFunnelHistory } from '@europrint/schemas';
import { eq, desc, sql, and } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { dbRows } from '../../common/db-rows';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleHrVacanciesFunnelRepository {

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

  // Q-Recruiting fix (2026-07-13): the Kanban page (RecruitingKanban.tsx /
  // useKanbanDragDrop) moves candidates through THIS endpoint, not the
  // `RecruitmentFunnelService.moveFunnelStage` state machine (they share the
  // same `hr_candidate_funnels` / `hr_funnel_history` tables but are separate
  // code paths — different stage vocab compatibility, see funnel-stage.vo.ts
  // header comment on REFERENCES/SINOV_COMPLETE). Previously this method did a
  // bare UPDATE with zero validation, zero `hr_funnel_history` audit row, and
  // silently discarded the caller's rejection `notes` — every Kanban drag/drop
  // and the "Rad etish" button left no trace and a rejected candidate's reason
  // was lost. Fixed additively: guard against reopening a closed (HIRED/
  // REJECTED) funnel, persist rejection_reason/is_active/rejected_at (or
  // hired_at) on terminal moves, and always insert a funnel-history row via
  // the existing `recordFunnelHistory` helper — reusing infra instead of
  // duplicating the Funnel aggregate's stricter (and here incompatible)
  // VALID_TRANSITIONS graph.
  async updatePipelineStage(id: number, stage: string, updatedBy: number, notes?: string): Promise<Result<Row>> {
    try {
      const currentRows = await rawSql(sql`
        SELECT id, funnel_stage FROM hr_candidate_funnels WHERE id = ${id}
      `);
      const current = dbRows(currentRows)[0];
      if (!current) return Err(`Pipeline #${id} topilmadi`);

      const fromStage = String(current['funnel_stage'] ?? '');
      if (fromStage === 'HIRED' || fromStage === 'REJECTED') {
        return Err(`Yopilgan funnel (${fromStage}) bosqichini o'zgartirib bo'lmaydi`);
      }

      let result;
      if (stage === 'REJECTED') {
        result = await rawSql(sql`
          UPDATE hr_candidate_funnels
          SET funnel_stage = ${stage}, is_active = false, rejected_at = NOW(),
              rejection_reason = COALESCE(${notes ?? null}, rejection_reason),
              updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, funnel_stage, candidate_id, vacancy_id, is_active, rejection_reason, updated_at
        `);
      } else if (stage === 'HIRED') {
        result = await rawSql(sql`
          UPDATE hr_candidate_funnels
          SET funnel_stage = ${stage}, hired_at = NOW(), updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, funnel_stage, candidate_id, vacancy_id, is_active, rejection_reason, updated_at
        `);
      } else {
        result = await rawSql(sql`
          UPDATE hr_candidate_funnels
          SET funnel_stage = ${stage}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, funnel_stage, candidate_id, vacancy_id, is_active, rejection_reason, updated_at
        `);
      }

      const row = dbRows(result)[0];
      if (!row) return Err("Bosqichni yangilashda xatolik");

      await this.recordFunnelHistory(String(id), stage, String(updatedBy), notes, fromStage);

      return Ok({ ...(row as Row), from_stage: fromStage });
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
      const funnelStats = (rows[0] ?? null) as Row | null;

      // Q12 fix: merge in the persisted market-analysis payload (hr_vacancy_profiles.market_analysis)
      // so a saved analysis is actually reflected on read, not just the candidate-count aggregate.
      const profileRows = await rawSql(sql`
        SELECT market_analysis, updated_at
        FROM hr_vacancy_profiles
        WHERE vacancy_id = ${vacancyId}
        LIMIT 1
      `);
      const profileRow = dbRows(profileRows)[0];
      const stored = profileRow?.['market_analysis'];
      const storedObj = (stored && typeof stored === 'object') ? stored as Row : null;

      if (!funnelStats && !storedObj) return Ok(null);
      return Ok({
        ...(funnelStats ?? {}),
        ...(storedObj ?? {}),
        analysis_saved_at: profileRow?.['updated_at'] ?? null,
      } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // Q12 fix: actually persist the submitted market-analysis payload — previously
  // the POST endpoint parsed the body then discarded it and echoed back a read.
  // hr_vacancy_profiles has no unique constraint on vacancy_id, so this does an
  // explicit check-then-branch instead of ON CONFLICT.
  async saveMarketAnalysis(vacancyId: number, data: Record<string, unknown>): Promise<Result<Row>> {
    try {
      const json = JSON.stringify(data ?? {});
      const existing = await rawSql(sql`
        SELECT id FROM hr_vacancy_profiles WHERE vacancy_id = ${vacancyId} LIMIT 1
      `);
      const existingRow = dbRows(existing)[0];

      let result;
      if (existingRow) {
        result = await rawSql(sql`
          UPDATE hr_vacancy_profiles
          SET market_analysis = ${json}::jsonb, updated_at = NOW()
          WHERE vacancy_id = ${vacancyId}
          RETURNING vacancy_id, market_analysis, updated_at
        `);
      } else {
        result = await rawSql(sql`
          INSERT INTO hr_vacancy_profiles (vacancy_id, market_analysis, created_at, updated_at)
          VALUES (${vacancyId}, ${json}::jsonb, NOW(), NOW())
          RETURNING vacancy_id, market_analysis, updated_at
        `);
      }
      const row = dbRows(result)[0];
      return Ok((row ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async recordFunnelHistory(funnelId: string, stage: string, changedBy: string, notes?: string, fromStage?: string | null): Promise<Result<Row>> {
    try {
      const [row] = await db.insert(hrFunnelHistory).values({
        funnelId, stage, changedBy, fromStage: fromStage ?? null, notes: notes ?? null,
      } as typeof hrFunnelHistory.$inferInsert).returning();
      return Ok((row ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  // P1.17.2: persist roadmap JSON into hr_funnel_history (stage='ROADMAP_GENERATED')
  async createRoadmapEntry(pipelineId: number, roadmapJson: string, userId: string): Promise<Result<Row>> {
    return this.recordFunnelHistory(String(pipelineId), 'ROADMAP_GENERATED', userId, roadmapJson);
  }

  // P1.17.2: retrieve the latest saved roadmap for a pipeline entry
  async findLatestRoadmapData(pipelineId: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select({
          id:         hrFunnelHistory.id,
          funnel_id:  hrFunnelHistory.funnelId,
          notes:      hrFunnelHistory.notes,
          created_at: hrFunnelHistory.createdAt,
        })
        .from(hrFunnelHistory)
        .where(eq(hrFunnelHistory.funnelId, String(pipelineId)))
        .orderBy(desc(hrFunnelHistory.createdAt))
        .limit(10);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      const roadmapRow = rows.find(r => {
        try { const parsed = JSON.parse(String(r.notes ?? '')); return parsed && typeof parsed === 'object'; } catch { return false; }
      });
      if (!roadmapRow) return Ok(null);
      try {
        const roadmap_data = JSON.parse(String(roadmapRow.notes));
        return Ok({ id: roadmapRow.id, funnel_id: roadmapRow.funnel_id, roadmap_data, created_at: roadmapRow.created_at } as Row);
      } catch { return Ok(null); }
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

  // Q13 fix: GET .../probation-review previously hardcoded { review: null } —
  // reviews recorded via recordFunnelHistory(stage='probation_reviewed') were
  // never read back. Mirrors the findLatestRoadmapData JSON-in-notes pattern,
  // but returns every matching entry (FE expects an array: ProbationReview[]).
  async findProbationReviews(pipelineId: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id:         hrFunnelHistory.id,
          funnel_id:  hrFunnelHistory.funnelId,
          notes:      hrFunnelHistory.notes,
          changed_by: hrFunnelHistory.changedBy,
          created_at: hrFunnelHistory.createdAt,
        })
        .from(hrFunnelHistory)
        .where(and(
          eq(hrFunnelHistory.funnelId, String(pipelineId)),
          eq(hrFunnelHistory.stage, 'probation_reviewed'),
        ))
        .orderBy(desc(hrFunnelHistory.createdAt));
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');

      const reviews = rows
        .map(r => {
          let parsed: Record<string, unknown> | null = null;
          try {
            const candidate = JSON.parse(String(r.notes ?? ''));
            if (candidate && typeof candidate === 'object') parsed = candidate as Record<string, unknown>;
          } catch { /* legacy plain-text notes (e.g. "probation_review rating=...") — not JSON */ }
          if (!parsed) return null;
          return {
            id: r.id,
            pipeline_entry_id: Number(r.funnel_id),
            reviewed_by: r.changed_by,
            created_at: r.created_at,
            ...parsed,
          } as Row;
        })
        .filter((r): r is Row => r !== null);

      return Ok(reviews);
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
