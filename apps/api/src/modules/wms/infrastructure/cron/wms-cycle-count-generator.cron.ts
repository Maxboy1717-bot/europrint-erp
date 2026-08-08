/**
 * @module wms-cycle-count-generator.cron
 * @description Ombor / Inventarizatsiya — "Davriy (rejalashtirilgan)" cycle-count avto-generatsiya.
 *   Vizyon (FAZA E): davriy (rejalashtirilgan) + kunlik cycle-count inventarizatsiya oqimi —
 *   sanash-topshiriq yaratish avtomatik bo'lishi kerak. Tekshiruv (2026-07-01): bunday cron
 *   UMUMAN YO'Q edi (grep tasdiqlangan) — bu fayl shu bo'shliqni yopadi.
 *
 *   Qoida: har ombor × ABC-segment (A/B/C) juftlik uchun standart ABC cycle-counting
 *   chastotasi qo'llaniladi (`CYCLE_COUNT_FREQUENCY_DAYS_A/B/C` — business.constants.ts):
 *   A (yuqori qiymat) tez-tez, C (past qiymat) kamroq sanaladi. Agar shu juftlik uchun
 *   oxirgi avto-generatsiya qilingan cycle-count "muddati" o'tgan bo'lsa (yoki hali umuman
 *   bo'lmasa) va faol (draft/in_progress) count yo'q bo'lsa — yangi `inventory_counts` (BASE
 *   TABLE, kanonik) qatori + stock-snapshot qator(lar) (`inventory_count_lines`) yaratiladi.
 *
 *   Dedup: `auto_generated=true AND cycle_abc_segment=X AND warehouse_id=Y` bo'yicha oxirgi
 *   `count_date` tekshiriladi + faol (draft/in_progress) count bo'lsa — qayta yaratilmaydi.
 *
 * NOTE: Raw SQL — ombor×ABC-segment agregatsiya + snapshot INSERT...SELECT (bulk, N+1 emas);
 *   Drizzle query-builder buni ifodalay olmaydi (murakkab GROUP BY + INSERT...SELECT
 *   material_cards.abc_segment filtri bilan). ARCHITECTURE_RULES.md Rule 4 ga muvofiq.
 * @layer Cron (WMS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import {
  CYCLE_COUNT_FREQUENCY_DAYS_A,
  CYCLE_COUNT_FREQUENCY_DAYS_B,
  CYCLE_COUNT_FREQUENCY_DAYS_C,
} from '@common/constants/business.constants';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface DueCombo {
  warehouse_id: number;
  abc_segment: 'A' | 'B' | 'C';
}

@Injectable()
export class WmsCycleCountGeneratorCron {
  private readonly logger = new Logger(WmsCycleCountGeneratorCron.name);

  private frequencyDaysFor(segment: string): number {
    if (segment === 'A') return CYCLE_COUNT_FREQUENCY_DAYS_A;
    if (segment === 'B') return CYCLE_COUNT_FREQUENCY_DAYS_B;
    return CYCLE_COUNT_FREQUENCY_DAYS_C;
  }

  /**
   * Har kuni 06:00 — ombor×ABC-segment juftliklarini tekshirib, muddati kelgan
   * cycle-count topshiriqlarini avtomatik yaratadi (stock-snapshot bilan birga).
   */
  @Cron('0 6 * * *')
  async generateDueCycleCounts(): Promise<void> {
    try {
      const combosR = await runQuery<DueCombo>(sql`
        SELECT DISTINCT ws.warehouse_id, mc.abc_segment
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_id
        JOIN warehouses w ON w.id = ws.warehouse_id
        WHERE ws.quantity > 0
          AND mc.abc_segment IN ('A', 'B', 'C')
          AND w.is_active = true
          AND w.deleted_at IS NULL
      `);
      if (combosR.rows.length === 0) return;

      let created = 0;
      for (const combo of combosR.rows) {
        const wasCreated = await this.generateForCombo(combo);
        if (wasCreated) created += 1;
      }
      if (created > 0) {
        this.logger.log(`Davriy cycle-count: ${created} yangi topshiriq avtomatik yaratildi`);
      }
    } catch (e) {
      this.logger.error(`generateDueCycleCounts: ${(e as Error).message}`);
    }
  }

  /** Bitta ombor×ABC-segment juftligi uchun: muddati kelganmi tekshirish + yaratish. */
  private async generateForCombo(combo: DueCombo): Promise<boolean> {
    const statusR = await runQuery<{ last_date: string | null; active_count: string }>(sql`
      SELECT
        MAX(count_date) FILTER (WHERE auto_generated = true) AS last_date,
        COUNT(*) FILTER (WHERE status IN ('draft', 'in_progress')) AS active_count
      FROM inventory_counts
      WHERE warehouse_id = ${combo.warehouse_id} AND cycle_abc_segment = ${combo.abc_segment}
    `);
    const row = statusR.rows[0];
    if (!row || Number(row.active_count) > 0) return false;

    const freqDays = this.frequencyDaysFor(combo.abc_segment);
    const lastDate = row.last_date ? new Date(row.last_date) : null;
    const isDue = !lastDate || (Date.now() - lastDate.getTime()) >= freqDays * MS_PER_DAY;
    if (!isDue) return false;

    await this.createCycleCount(combo);
    return true;
  }

  /** Yangi avto cycle-count + stock-snapshot qatorlarini yaratadi (bulk INSERT...SELECT). */
  private async createCycleCount(combo: DueCombo): Promise<void> {
    const seqR = await runQuery<{ cnt: number }>(sql`SELECT COUNT(*)::int AS cnt FROM inventory_counts`);
    const seq = (seqR.rows[0]?.cnt ?? 0) + 1;
    const countNumber = `CYC-${combo.abc_segment}-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

    const insertR = await runQuery<{ id: number }>(sql`
      INSERT INTO inventory_counts
        (count_number, count_date, warehouse_id, count_type, status, total_items,
         notes, created_at, scheduled_for, auto_generated, cycle_abc_segment)
      VALUES
        (${countNumber}, CURRENT_DATE, ${combo.warehouse_id}, 'cycle', 'draft', 0,
         ${`Avtomatik davriy cycle-count (ABC segment ${combo.abc_segment})`},
         NOW(), CURRENT_DATE, true, ${combo.abc_segment})
      RETURNING id
    `);
    const countId = insertR.rows[0]?.id;
    if (!countId) return;

    await runQuery(sql`
      INSERT INTO inventory_count_lines
        (count_id, material_id, item_type, book_quantity, system_qty, unit_cost, book_value, created_at)
      SELECT ${countId}, ws.material_id, 'material', ws.quantity, ws.quantity,
             COALESCE(mc.unit_price, 0), ws.quantity * COALESCE(mc.unit_price, 0), NOW()
      FROM warehouse_stock ws
      JOIN material_cards mc ON mc.id = ws.material_id
      WHERE ws.warehouse_id = ${combo.warehouse_id}
        AND mc.abc_segment = ${combo.abc_segment}
        AND ws.quantity > 0
    `);

    await runQuery(sql`
      UPDATE inventory_counts SET
        total_items      = (SELECT COUNT(*) FROM inventory_count_lines WHERE count_id = ${countId}),
        total_book_value = (SELECT COALESCE(SUM(book_value), 0) FROM inventory_count_lines WHERE count_id = ${countId})
      WHERE id = ${countId}
    `);

    this.logger.log(`Cycle-count yaratildi: ${countNumber} (ombor=${combo.warehouse_id}, ABC=${combo.abc_segment})`);
  }
}
