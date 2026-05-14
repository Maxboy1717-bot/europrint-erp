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
      code:                 e.code,
      category:             e.category,
      name:                 e.name,
      name_ru:              e.nameRu,
      severity:             e.severity,
      default_fine_percent: e.finePercent,
      default_fine_amount:  e.fineAmount,
      points_deducted:      e.points,
      description:          e.description,
      is_active:            true,
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
      name_ru:      b.nameRu,
      icon:         b.icon,
      description:  b.desc,
      criteria:     b.criteria,
      point_value:  b.points,
      is_auto_award: b.auto,
      is_active:    true,
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
      start_date:  sql`CURRENT_DATE`,
      end_date:    sql`CURRENT_DATE + INTERVAL '14 days'`,
    });
  }
}
