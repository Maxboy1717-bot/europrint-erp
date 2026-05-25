/**
 * @module discipline-record.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { discipline_records } from '@shared/db';
import { Result, Ok, Err, AppError } from '@common/result';

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
      await db.insert(discipline_records).values(data);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
