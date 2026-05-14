/**
 * @module finance-ai.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { gl_entries as glDocuments } from '@shared/db';
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
        totalAmount: sql<string>`COALESCE(SUM(CASE WHEN ${glDocuments.reference_type} = 'payment' THEN 1 ELSE 0 END), 0)::text`,
      })
      .from(glDocuments)
      .where(gte(glDocuments.created_at, since));
    return s;
  }

  async loadRecentDocs(limit: number): Promise<GlDoc[]> {
    return db
      .select({
        docNumber: glDocuments.entry_number,
        docType: glDocuments.reference_type,
        status: glDocuments.description,
        date: glDocuments.posted_at,
      })
      .from(glDocuments)
      .orderBy(desc(glDocuments.created_at))
      .limit(limit);
  }
}
