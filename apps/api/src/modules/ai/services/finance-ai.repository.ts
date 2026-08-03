/**
 * @module finance-ai.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
// GL two-world fix (2026-07-14): gl_entries has zero writers since the
// 2026-06-17..07-02 SAP#76 consolidation onto `entries` (ADR-003 canonical) —
// anomaly detection was silently seeing 0 rows. `entries` has the same
// referenceType/createdAt/entryNumber/postedAt columns, so this is a straight swap.
import { entries as glDocuments } from '@shared/db';
import { desc, gte, sql, count } from 'drizzle-orm';

export interface GlStats {
  totalDocs: number;
  totalAmount: string;
}

export interface GlDoc {
  docNumber: string | null;
  docType: string | null;
  status: string | null;
  date: Date | null;
}

@Injectable()
export class FinanceAiRepository {
  async loadGlStats(since: Date): Promise<GlStats | undefined> {
    const [s] = await db
      .select({
        totalDocs: count(),
        totalAmount: sql<string>`COALESCE(SUM(CASE WHEN ${glDocuments.referenceType} = 'payment' THEN 1 ELSE 0 END), 0)::text`,
      })
      .from(glDocuments)
      .where(gte(glDocuments.createdAt, since));
    return s;
  }

  async loadRecentDocs(limit: number): Promise<GlDoc[]> {
    return db
      .select({
        docNumber: glDocuments.entryNumber,
        docType: glDocuments.referenceType,
        status: glDocuments.description,
        date: glDocuments.postedAt,
      })
      .from(glDocuments)
      .orderBy(desc(glDocuments.createdAt))
      .limit(limit);
  }
}
