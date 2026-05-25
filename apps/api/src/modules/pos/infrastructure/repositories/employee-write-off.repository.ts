/**
 * @module employee-write-off.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { employeeLiabilityCases, db, eq, and, sql } from '@workspace/db';
import { safeCall, Result } from '@common/result';

export interface UpdateLiabilityCaseFields {
  status: string;
  compensatedAmount?: number | null;
  compensationDate?: string;
  closedAt?: string;
  closedBy?: number;
  updatedAt?: Date;
}

type LiabilityCase = typeof employeeLiabilityCases.$inferSelect;

@Injectable()
export class EmployeeWriteOffRepository {
  async updateLiabilityCase(id: number, fields: UpdateLiabilityCaseFields): Promise<Result<LiabilityCase | undefined>> {
    return safeCall(async () => {
      const [updated] = await db
        .update(employeeLiabilityCases)
        .set({
          status:             fields.status as 'OPEN' | 'COMPENSATED' | 'WRITTEN_OFF' | 'CLOSED' | 'UNDER_INVESTIGATION',
          compensatedAmount:  fields.compensatedAmount ?? undefined,
          compensationDate:   fields.compensationDate ? new Date(fields.compensationDate) : undefined,
          closedAt:           fields.closedAt ? new Date(fields.closedAt) : undefined,
          closedBy:           fields.closedBy,
          updatedAt:          fields.updatedAt ?? _time.now(),
        })
        .where(eq(employeeLiabilityCases.id, id))
        .returning();
      return updated;
      }, 'DB_ERROR');
  }

  async getOpenLiabilityCases(userId: number): Promise<Result<LiabilityCase[]>> {
    return safeCall(async () => {
      return db
        .select()
        .from(employeeLiabilityCases)
        .where(
          and(
            eq(employeeLiabilityCases.userId, userId),
            sql`${employeeLiabilityCases.status} IN ('OPEN', 'UNDER_REVIEW')`,
          ),
        );
      }, 'DB_ERROR');
  }
}
