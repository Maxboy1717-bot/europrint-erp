/**
 * @module hr-rating.reader
 * @description Thin DB reader for the 7-factor employee rating.
 *   Reads EXISTING tables only — never adds schema or columns.
 *   Maps raw DB aggregates to HrRatingFactors (each 0-100).
 *
 * ## Factor → Table mapping (READ-ONLY; no writes)
 *
 *   norm        — hr_360_feedback (quantity / 5000 norm × 100)
 *                 Neutral default = 50 when no production feedback rows exist.
 *                 NOTE: a proper per-employee target table does not yet exist in
 *                 the schema (mes_production_sessions.target_qty is unavailable to
 *                 this service); the 5 000 workshop-wide baseline (same as
 *                 EmployeeKpiHandler) is used as the interim norm target.
 *
 *   attendance  — attendance table (present_days / work_days_in_period × 100)
 *                 Neutral default = 80 when no attendance rows exist.
 *                 Rationale: "no data" typically means the employee was not yet
 *                 onboarded for that period, not that they were absent.
 *
 *   quality     — hr_360_feedback.defect_rate (100 - avg_defect_rate)
 *                 Neutral default = 70 when no feedback rows exist.
 *
 *   seniority   — razryad_levels.coefficient via employees → org_functions →
 *                 razryad_levels join (coefficient 1-6 → scaled to 0-100 as
 *                 (coefficient / 6) × 100).
 *                 Neutral default = 50 (coefficient ≈ 3; mid-range) when no
 *                 razryad is assigned.
 *
 *   discipline  — discipline_records (100 - infractions_in_period × 10)
 *                 Each open/unresolved infraction deducts 10 points (capped 0).
 *                 Neutral default = 100 when no records exist (clean slate).
 *
 *   peer        — employee_360_assessments.peer_rating (numeric 0-5 → × 20)
 *                 Most-recent assessment row used.
 *                 Neutral default = 50 when no peer assessment exists.
 *
 *   aiKpi       — hr_daily_reports: fraction of days with status='submitted'
 *                 or status='approved' in the period (submitted_days / work_days × 100).
 *                 Neutral default = 60 when no daily reports exist.
 *
 * @layer Infrastructure — Repository (HR)
 * @warning touchedLibDb=false — no lib/db schema files are touched here.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { HrRatingFactors } from '../../domain/services/hr-rating.service';
import { Result, Ok, Err } from '@common/result';

// ---------------------------------------------------------------------------
// Neutral defaults (documented per factor above)
// ---------------------------------------------------------------------------

/** Default when no norm / production data exists (mid-range). */
const NEUTRAL_NORM = 50;
/** Default when no attendance data exists (assume onboarding gap, not absence). */
const NEUTRAL_ATTENDANCE = 80;
/** Default when no quality / defect data exists (mid-high quality assumed). */
const NEUTRAL_QUALITY = 70;
/** Default seniority when no razryad is assigned (mid-range coefficient=3). */
const NEUTRAL_SENIORITY = 50;
/** Default discipline when no infraction records exist (clean slate = max). */
const NEUTRAL_DISCIPLINE = 100;
/** Default peer rating when no 360-assessment row exists (neutral mid-range). */
const NEUTRAL_PEER = 50;
/** Default AI KPI when no daily reports exist (partial compliance assumed). */
const NEUTRAL_AI_KPI = 60;

/** Points deducted per active/open discipline infraction. */
const DISCIPLINE_POINTS_PER_INFRACTION = 10;

/** Workshop-wide norm target (units/period). Matches EmployeeKpiHandler baseline. */
const NORM_TARGET_UNITS = 5_000;

/** Maximum razryad coefficient (level 6 → 100 points). */
const RAZRYAD_MAX_COEFF = 6;

/** Factor score must stay in [0, 100]. */
function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

// ---------------------------------------------------------------------------
// Types for raw query rows
// ---------------------------------------------------------------------------

interface AttendanceAgg {
  present_days: string | null;
  late_days: string | null;
  total_days: string | null;
}

interface FeedbackAgg {
  total_quantity: string | null;
  avg_defect_rate: string | null;
  row_count: string | null;
}

interface DisciplineAgg {
  infraction_count: string | null;
}

interface AssessmentRow {
  peer_rating: string | null;
}

interface DailyReportAgg {
  submitted_count: string | null;
  total_count: string | null;
}

interface CoeffRow {
  coefficient: string | null;
}

// ---------------------------------------------------------------------------
// Factor notes (surfaced in the API response for transparency)
// ---------------------------------------------------------------------------

export interface HrRatingFactorMeta {
  /** Factor key (norm | attendance | ...). */
  factor: keyof HrRatingFactors;
  /** 0-100 score actually fed to HrRatingService. */
  score: number;
  /** True when no real data was found — neutral default applied. */
  isDefault: boolean;
  /** Human-readable note (default name + reason, or data source description). */
  note: string;
}

/** Full reader output — factors + per-factor metadata. */
export interface HrRatingReaderResult {
  factors: HrRatingFactors;
  meta: HrRatingFactorMeta[];
}

// ---------------------------------------------------------------------------
// Reader service
// ---------------------------------------------------------------------------

@Injectable()
export class HrRatingReader {
  private readonly logger = new Logger(HrRatingReader.name);

  /**
   * Read all 7 rating factors for `employeeId` over the last 30 calendar days.
   *
   * The period is always the trailing 30 days from today so the rating is
   * "current" and requires no date parameter from the caller. This keeps the
   * API surface thin (GET /hr/employees/:id/rating with no query params).
   *
   * Returns Ok(HrRatingReaderResult) always — every factor has a neutral
   * fallback so the computation never fails due to missing data.
   *
   * @param employeeId - integer employee PK
   */
  async readFactors(employeeId: number): Promise<Result<HrRatingReaderResult>> {
    try {
      const [attendance, feedback, discipline, assessment, dailyReport, coefficient] =
        await Promise.all([
          this._readAttendance(employeeId),
          this._readFeedback(employeeId),
          this._readDiscipline(employeeId),
          this._readPeerAssessment(employeeId),
          this._readDailyReports(employeeId),
          this._readRazryadCoefficient(employeeId),
        ]);

      const meta: HrRatingFactorMeta[] = [
        attendance.meta,
        feedback.normMeta,
        feedback.qualityMeta,
        coefficient.meta,
        discipline.meta,
        assessment.meta,
        dailyReport.meta,
      ];

      const factors: HrRatingFactors = {
        norm:       feedback.normScore,
        attendance: attendance.score,
        quality:    feedback.qualityScore,
        seniority:  coefficient.score,
        discipline: discipline.score,
        peer:       assessment.score,
        aiKpi:      dailyReport.score,
      };

      return Ok({ factors, meta });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`readFactors(${employeeId}): ${msg}`);
      return Err(msg);
    }
  }

  // ---------------------------------------------------------------------------
  // Private factor readers
  // ---------------------------------------------------------------------------

  /** Attendance factor — present+late rows / total rows in last 30 days. */
  private async _readAttendance(employeeId: number): Promise<{
    score: number;
    meta: HrRatingFactorMeta;
  }> {
    try {
      const rows = await runQuery<AttendanceAgg>(sql`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('present','late'))::text AS present_days,
          COUNT(*) FILTER (WHERE status = 'late')::text              AS late_days,
          COUNT(*)::text                                             AS total_days
        FROM attendance
        WHERE employee_id = ${employeeId}
          AND attendance_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      const row = rows.rows[0];
      const total = parseInt(String(row?.total_days ?? '0'), 10);
      if (!total) {
        return {
          score: NEUTRAL_ATTENDANCE,
          meta: {
            factor: 'attendance',
            score: NEUTRAL_ATTENDANCE,
            isDefault: true,
            note: `No attendance records in last 30 days; using neutral default (${NEUTRAL_ATTENDANCE}).`,
          },
        };
      }
      const present = parseInt(String(row?.present_days ?? '0'), 10);
      const score = clamp(Math.round((present / total) * 100));
      return {
        score,
        meta: {
          factor: 'attendance',
          score,
          isDefault: false,
          note: `${present}/${total} days present or late (last 30 days). attendance table.`,
        },
      };
    } catch (err: unknown) {
      this.logger.warn(`_readAttendance(${employeeId}): ${(err as Error).message} — using default`);
      return {
        score: NEUTRAL_ATTENDANCE,
        meta: {
          factor: 'attendance',
          score: NEUTRAL_ATTENDANCE,
          isDefault: true,
          note: `DB error reading attendance; using neutral default (${NEUTRAL_ATTENDANCE}).`,
        },
      };
    }
  }

  /**
   * Norm + quality factors — both come from hr_360_feedback in one query.
   * norm:    (total quantity / NORM_TARGET_UNITS) × 100, clamped 0-100.
   * quality: 100 − avg_defect_rate, clamped 0-100.
   */
  private async _readFeedback(employeeId: number): Promise<{
    normScore: number;
    qualityScore: number;
    normMeta: HrRatingFactorMeta;
    qualityMeta: HrRatingFactorMeta;
  }> {
    try {
      const rows = await runQuery<FeedbackAgg>(sql`
        SELECT
          COALESCE(SUM(quantity::numeric), 0)::text           AS total_quantity,
          COALESCE(AVG(defect_rate::numeric), 0)::text        AS avg_defect_rate,
          COUNT(*)::text                                      AS row_count
        FROM hr_360_feedback
        WHERE employee_id = ${employeeId}
          AND recorded_at >= CURRENT_DATE - INTERVAL '30 days'
      `);
      const row = rows.rows[0];
      const rowCount = parseInt(String(row?.row_count ?? '0'), 10);

      if (!rowCount) {
        return {
          normScore: NEUTRAL_NORM,
          qualityScore: NEUTRAL_QUALITY,
          normMeta: {
            factor: 'norm',
            score: NEUTRAL_NORM,
            isDefault: true,
            note: `No hr_360_feedback rows in last 30 days; using neutral default (${NEUTRAL_NORM}).`,
          },
          qualityMeta: {
            factor: 'quality',
            score: NEUTRAL_QUALITY,
            isDefault: true,
            note: `No hr_360_feedback rows in last 30 days; using neutral default (${NEUTRAL_QUALITY}).`,
          },
        };
      }

      const totalQty = parseFloat(String(row?.total_quantity ?? '0'));
      const avgDefect = parseFloat(String(row?.avg_defect_rate ?? '0'));

      const normScore = clamp(Math.round((totalQty / NORM_TARGET_UNITS) * 100));
      const qualityScore = clamp(Math.round(100 - avgDefect));

      return {
        normScore,
        qualityScore,
        normMeta: {
          factor: 'norm',
          score: normScore,
          isDefault: false,
          note: `Total quantity ${totalQty} vs target ${NORM_TARGET_UNITS} (last 30 days). hr_360_feedback table.`,
        },
        qualityMeta: {
          factor: 'quality',
          score: qualityScore,
          isDefault: false,
          note: `Avg defect rate ${avgDefect.toFixed(2)}% → quality = 100 − ${avgDefect.toFixed(2)} (last 30 days). hr_360_feedback table.`,
        },
      };
    } catch (err: unknown) {
      this.logger.warn(`_readFeedback(${employeeId}): ${(err as Error).message} — using defaults`);
      return {
        normScore: NEUTRAL_NORM,
        qualityScore: NEUTRAL_QUALITY,
        normMeta: {
          factor: 'norm',
          score: NEUTRAL_NORM,
          isDefault: true,
          note: `DB error reading hr_360_feedback; using neutral default (${NEUTRAL_NORM}).`,
        },
        qualityMeta: {
          factor: 'quality',
          score: NEUTRAL_QUALITY,
          isDefault: true,
          note: `DB error reading hr_360_feedback; using neutral default (${NEUTRAL_QUALITY}).`,
        },
      };
    }
  }

  /**
   * Discipline factor — 100 minus 10 pts per open infraction in last 90 days.
   * discipline_records.is_soft_deleted=false and status != 'resolved'.
   */
  private async _readDiscipline(employeeId: number): Promise<{
    score: number;
    meta: HrRatingFactorMeta;
  }> {
    try {
      const rows = await runQuery<DisciplineAgg>(sql`
        SELECT COUNT(*)::text AS infraction_count
        FROM discipline_records
        WHERE employee_id = ${employeeId}
          AND COALESCE(is_soft_deleted, false) = false
          AND COALESCE(status, 'open') <> 'resolved'
          AND created_at >= CURRENT_DATE - INTERVAL '90 days'
      `);
      const row = rows.rows[0];
      const infractions = parseInt(String(row?.infraction_count ?? '0'), 10);

      if (infractions === 0) {
        return {
          score: NEUTRAL_DISCIPLINE,
          meta: {
            factor: 'discipline',
            score: NEUTRAL_DISCIPLINE,
            isDefault: false,
            note: `No active infractions in last 90 days. discipline_records table.`,
          },
        };
      }

      const score = clamp(100 - infractions * DISCIPLINE_POINTS_PER_INFRACTION);
      return {
        score,
        meta: {
          factor: 'discipline',
          score,
          isDefault: false,
          note: `${infractions} active infraction(s) in last 90 days × ${DISCIPLINE_POINTS_PER_INFRACTION}pts each. discipline_records table.`,
        },
      };
    } catch (err: unknown) {
      this.logger.warn(`_readDiscipline(${employeeId}): ${(err as Error).message} — using default`);
      return {
        score: NEUTRAL_DISCIPLINE,
        meta: {
          factor: 'discipline',
          score: NEUTRAL_DISCIPLINE,
          isDefault: true,
          note: `DB error reading discipline_records; using neutral default (${NEUTRAL_DISCIPLINE}).`,
        },
      };
    }
  }

  /**
   * Peer factor — most recent employee_360_assessments.peer_rating (0-5 → × 20 → 0-100).
   * Service-chain peer review per the vision spec.
   */
  private async _readPeerAssessment(employeeId: number): Promise<{
    score: number;
    meta: HrRatingFactorMeta;
  }> {
    try {
      const rows = await runQuery<AssessmentRow>(sql`
        SELECT peer_rating::text
        FROM employee_360_assessments
        WHERE employee_id = ${employeeId}
          AND peer_rating IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const row = rows.rows[0];
      if (!row?.peer_rating) {
        return {
          score: NEUTRAL_PEER,
          meta: {
            factor: 'peer',
            score: NEUTRAL_PEER,
            isDefault: true,
            note: `No peer rating in employee_360_assessments; using neutral default (${NEUTRAL_PEER}).`,
          },
        };
      }
      const raw = parseFloat(String(row.peer_rating));
      // peer_rating column is numeric 0-5 (from FE slider); scale to 0-100
      const score = clamp(Math.round(raw * 20));
      return {
        score,
        meta: {
          factor: 'peer',
          score,
          isDefault: false,
          note: `Peer rating ${raw}/5 → ${score}/100 (most recent employee_360_assessments row).`,
        },
      };
    } catch (err: unknown) {
      this.logger.warn(`_readPeerAssessment(${employeeId}): ${(err as Error).message} — using default`);
      return {
        score: NEUTRAL_PEER,
        meta: {
          factor: 'peer',
          score: NEUTRAL_PEER,
          isDefault: true,
          note: `DB error reading employee_360_assessments; using neutral default (${NEUTRAL_PEER}).`,
        },
      };
    }
  }

  /**
   * AI KPI factor — fraction of days with a submitted/approved daily report.
   * hr_daily_reports.status IN ('submitted','approved') in last 30 days.
   */
  private async _readDailyReports(employeeId: number): Promise<{
    score: number;
    meta: HrRatingFactorMeta;
  }> {
    try {
      const rows = await runQuery<DailyReportAgg>(sql`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('submitted','approved'))::text AS submitted_count,
          COUNT(*)::text AS total_count
        FROM hr_daily_reports
        WHERE employee_id = ${employeeId}
          AND report_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      const row = rows.rows[0];
      const total = parseInt(String(row?.total_count ?? '0'), 10);

      if (!total) {
        return {
          score: NEUTRAL_AI_KPI,
          meta: {
            factor: 'aiKpi',
            score: NEUTRAL_AI_KPI,
            isDefault: true,
            note: `No daily report rows in last 30 days; using neutral default (${NEUTRAL_AI_KPI}).`,
          },
        };
      }

      const submitted = parseInt(String(row?.submitted_count ?? '0'), 10);
      const score = clamp(Math.round((submitted / total) * 100));
      return {
        score,
        meta: {
          factor: 'aiKpi',
          score,
          isDefault: false,
          note: `${submitted}/${total} daily reports submitted/approved (last 30 days). hr_daily_reports table.`,
        },
      };
    } catch (err: unknown) {
      this.logger.warn(`_readDailyReports(${employeeId}): ${(err as Error).message} — using default`);
      return {
        score: NEUTRAL_AI_KPI,
        meta: {
          factor: 'aiKpi',
          score: NEUTRAL_AI_KPI,
          isDefault: true,
          note: `DB error reading hr_daily_reports; using neutral default (${NEUTRAL_AI_KPI}).`,
        },
      };
    }
  }

  /**
   * Seniority factor — razryad coefficient via employees → org_functions →
   * razryad_levels chain.  Coefficient 1-6 → scaled (coeff / 6) × 100.
   */
  private async _readRazryadCoefficient(employeeId: number): Promise<{
    score: number;
    meta: HrRatingFactorMeta;
  }> {
    try {
      const rows = await runQuery<CoeffRow>(sql`
        SELECT COALESCE(rl.coefficient, NULL)::text AS coefficient
        FROM employees e
        LEFT JOIN org_functions ofn ON ofn.id = e.org_function_id
        LEFT JOIN razryad_levels rl ON rl.id = ofn.razryad_level_id
        WHERE e.id = ${employeeId}
        LIMIT 1
      `);
      const row = rows.rows[0];
      const coeff = row?.coefficient ? parseFloat(String(row.coefficient)) : null;

      if (coeff === null || isNaN(coeff) || coeff <= 0) {
        return {
          score: NEUTRAL_SENIORITY,
          meta: {
            factor: 'seniority',
            score: NEUTRAL_SENIORITY,
            isDefault: true,
            note: `No razryad_level assigned via org_functions; using neutral default (${NEUTRAL_SENIORITY}).`,
          },
        };
      }

      const score = clamp(Math.round((coeff / RAZRYAD_MAX_COEFF) * 100));
      return {
        score,
        meta: {
          factor: 'seniority',
          score,
          isDefault: false,
          note: `razryad coefficient ${coeff} / ${RAZRYAD_MAX_COEFF} = ${score}/100. razryad_levels table.`,
        },
      };
    } catch (err: unknown) {
      this.logger.warn(`_readRazryadCoefficient(${employeeId}): ${(err as Error).message} — using default`);
      return {
        score: NEUTRAL_SENIORITY,
        meta: {
          factor: 'seniority',
          score: NEUTRAL_SENIORITY,
          isDefault: true,
          note: `DB error reading razryad_levels; using neutral default (${NEUTRAL_SENIORITY}).`,
        },
      };
    }
  }
}
