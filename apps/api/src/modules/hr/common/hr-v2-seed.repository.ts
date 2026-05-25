/**
 * @module hr-v2-seed.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { violation_catalog, badge_catalog, enps_surveys } from '@shared/db';
import { safeCall, Result } from '@common/result';

@Injectable()
export class HrV2SeedRepository {
  async getViolationCatalogCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await db.select({ cnt: sql<number>`COUNT(*)::int` }).from(violation_catalog);
      return r[0]?.cnt ?? 0;
      }, 'DB_ERROR');
  }

  async insertViolationCatalogEntry(e: { code: string; category: string; name: string; nameRu: string; severity: string; finePercent: string; fineAmount: string; points: number; description: string }): Promise<void> {
    await db.insert(violation_catalog).values({
      code:               e.code,
      category:           e.category,
      name:               e.name,
      nameRu:             e.nameRu,
      severity:           e.severity,
      defaultFinePercent: e.finePercent,
      defaultFineAmount:  e.fineAmount,
      pointsDeducted:     e.points,
      description:        e.description,
      isActive:           true,
    }).onConflictDoNothing();
  }

  async getBadgeCatalogCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await db.select({ cnt: sql<number>`COUNT(*)::int` }).from(badge_catalog);
      return r[0]?.cnt ?? 0;
      }, 'DB_ERROR');
  }

  async insertBadgeCatalogEntry(b: { code: string; name: string; nameRu: string; icon: string; desc: string; criteria: string; points: number; auto: boolean }): Promise<void> {
    await db.insert(badge_catalog).values({
      code:         b.code,
      name:         b.name,
      nameRu:       b.nameRu,
      icon:         b.icon,
      description:  b.desc,
      criteria:     b.criteria,
      pointValue:   b.points,
      isAutoAward:  b.auto,
      isActive:     true,
    }).onConflictDoNothing();
  }

  async getEnpsSurveyCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await db.select({ cnt: sql<number>`COUNT(*)::int` }).from(enps_surveys);
      return r[0]?.cnt ?? 0;
      }, 'DB_ERROR');
  }

  async insertEnpsSurvey(questions: string): Promise<void> {
    await db.insert(enps_surveys).values({
      title:       "Q2 2026 xodimlar mamnuniyati so'rovi",
      description: "Har choraklik eNPS so'rovi — xodimlar fikri va kompaniyani tavsiya qilish darajasini o'lchash",
      questions:   sql`${questions}::jsonb`,
      period:      'quarterly',
      status:      'draft',
      startDate:   sql`CURRENT_DATE`,
      endDate:     sql`CURRENT_DATE + INTERVAL '14 days'`,
    });
  }
}
