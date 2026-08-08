/**
 * @module discipline-record.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { discipline_records } from '@shared/db';
import { Result, Ok, Err, AppError } from '@common/result';
import { computeDisciplineEscalation, escalationFlags } from './discipline-escalation.helper';

export interface InsertDisciplineRecord {
  employeeId:     number;
  violationType:  string;
  disciplineType: string;
  description:    string;
  violationDate:  string;
  issuedDate:     string;
  severity:       string;
  issuedBy:       number;
  status:         string;
}

@Injectable()
export class DisciplineRecordRepository {
  async insert(data: InsertDisciplineRecord): Promise<Result<void, AppError>> {
    try {
      // Owner directive 2026-07-13 (HR Nazorat fix): stamp the cumulative escalation
      // stage (verbal/written/fine/dismissal) on every new discipline record — see
      // discipline-escalation.helper.ts for the business_settings-driven thresholds.
      const { stage, cumulativeCount, previousRecordId } =
        await computeDisciplineEscalation(data.employeeId);
      const flags = escalationFlags(stage);
      // HR Nazorat fix (2026-07-13, verified live): reason/given_by are NOT NULL on the
      // live DB (see lib/db/src/schema/discipline.ts doc-comment) — this insert never set
      // either, which would 500 for any caller (late-arrival.service.ts /
      // record-attendance.handler.ts already pass description + issuedBy on every call).
      await db.insert(discipline_records).values({
        ...data,
        reason: data.description,
        givenBy: data.issuedBy,
        escalationStage: stage,
        violationCountThisCategory: cumulativeCount,
        previousWarningId: previousRecordId,
        ...flags,
      });
      return Ok(undefined);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
