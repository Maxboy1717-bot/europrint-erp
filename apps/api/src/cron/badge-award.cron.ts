/**
 * Badge Award Cron — har hafta xodimlarga badges avtomatik beradi.
 *
 * PRD Q165-167:
 *   - Avto kriteriyalar bo'yicha badge berish
 *   - Mukammal davomat = oy oxirida 0 ta kechikish
 *   - Erta keluvchi = oy davomida 5+ marta erta keladi
 *   - Xavfsizlik chempioni = chorak ichida 0 ta xavfsizlik buzilishi
 *   - Sifat yulduzi = oy davomida 0 ta brak
 *   - Nol nuqson = chorak davomida 0 ta intizomiy yozuv
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../modules/hr/common/db-rows';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class BadgeAwardCron {
  private readonly logger = new Logger(BadgeAwardCron.name);

  constructor(private readonly cronStatus: CronStatusService) {}

  /**
   * Har oyning 1-kuni soat 09:00 da:
   * - PERFECT_ATTENDANCE — 0 ta kechikish, 0 ta yo'qlik o'tgan oyda
   * - EARLY_BIRD        — 5+ marta erta kelgan
   * - SAFETY_CHAMPION   — 0 ta safety incident
   * - QUALITY_STAR      — 0 ta brak (QC defect)
   * - ZERO_DEFECT       — 0 ta intizomiy yozuv
   */
  @Cron('0 9 1 * *')
  async awardMonthlyBadges(): Promise<void> {
    const jobName = 'BadgeAwardCron';
    try {
      const monthStart = sql`DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 day')`;
      const monthEnd = sql`DATE_TRUNC('month', CURRENT_DATE)`;

      let total = 0;

      // 1. PERFECT_ATTENDANCE — o'tgan oyda hech qanday discipline yozuvi yo'q
      total += await this._awardByCriteria('PERFECT_ATTENDANCE', sql`
        SELECT e.id AS employee_id
        FROM employees e
        WHERE e.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM discipline_records d
            WHERE d.employee_id = e.id
              AND d.violation_date >= ${monthStart}
              AND d.violation_date < ${monthEnd}
              AND d.is_soft_deleted = false
          )
      `);

      // 2. SAFETY_CHAMPION — o'tgan chorakda safety_incidents yo'q
      total += await this._awardByCriteria('SAFETY_CHAMPION', sql`
        SELECT e.id AS employee_id
        FROM employees e
        WHERE e.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM safety_incidents s
            WHERE s.user_id = e.id
              AND s.incident_date >= CURRENT_DATE - INTERVAL '90 days'
          )
      `);

      // 3. ZERO_DEFECT — chorak ichida hech qanday discipline yo'q
      total += await this._awardByCriteria('ZERO_DEFECT', sql`
        SELECT e.id AS employee_id
        FROM employees e
        WHERE e.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM discipline_records d
            WHERE d.employee_id = e.id
              AND d.violation_date >= CURRENT_DATE - INTERVAL '90 days'
              AND d.is_soft_deleted = false
          )
      `);

      this.logger.log(`✅ BadgeAwardCron: total=${total} badges awarded`);
      this.cronStatus.recordSuccess(jobName);
    } catch (err) {
      this.logger.error(`❌ BadgeAwardCron error: ${String(err)}`);
      this.cronStatus.recordFailure(jobName, String(err));
    }
  }

  /**
   * Berilgan kriteriya SQL'ni bajarib, badge'ni layoiq xodimlarga beradi.
   */
  private async _awardByCriteria(badgeCode: string, criteriaSql: ReturnType<typeof sql>): Promise<number> {
    // Badge ID topish
    const badgeRows = await rawSql(sql`
      SELECT id, point_value FROM badge_catalog
      WHERE code = ${badgeCode} AND is_active = true AND is_auto_award = true
      LIMIT 1
    `);
    const badge = dbRows(badgeRows)[0];
    if (!badge) {
      this.logger.warn(`Badge ${badgeCode} not found or not auto_award`);
      return 0;
    }

    // Layoiq xodimlarni topish
    const eligibleRows = await rawSql(criteriaSql);
    const eligible = dbRows(eligibleRows).map((r) => Number(r['employee_id']));
    const safeEligible = Array.isArray(eligible) ? eligible : [];

    if (safeEligible.length === 0) return 0;

    // Achievements/gamification_points'ga insert (faqat yo'q bo'lganlarga)
    let awardCount = 0;
    for (const empId of safeEligible) {
      try {
        await rawSql(sql`
          INSERT INTO gamification_points (
            employee_id, points, event_type, description, reason, given_by, reference_id, created_at
          )
          SELECT
            ${empId},
            ${badge['point_value']},
            'badge_award',
            ${'Badge: ' + badgeCode},
            ${'Avto-berish: ' + badgeCode + ' (oylik kriteriya)'},
            1,
            ${badge['id']},
            NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM gamification_points gp
            WHERE gp.employee_id = ${empId}
              AND gp.reference_id = ${badge['id']}
              AND gp.created_at >= CURRENT_DATE - INTERVAL '7 days'
          )
        `);
        awardCount++;
      } catch (e) {
        this.logger.warn(`Award ${badgeCode} to emp ${empId} failed: ${String(e)}`);
      }
    }

    this.logger.log(`✓ ${badgeCode}: ${awardCount}/${safeEligible.length} xodimga berildi`);
    return awardCount;
  }
}
