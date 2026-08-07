/**
 * @module qc.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';


@Injectable()
export class QcBotService {
  private readonly logger = new Logger(QcBotService.name);
  readonly botName = 'qc_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('qc', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/braks' || msg.text.toLowerCase().includes('brak')) return this.getBraks();
    if (cmd === '/dpmo'  || msg.text.toLowerCase().includes('dpmo')) return this.getDpmo();

    return helpReply('🔍 QC Bot:\n/braks — Joriy brak statistikasi\n/dpmo — DPMO ko\'rsatkichi');
  }

  private async getBraks(): Promise<BotReply> {
    // qc_braks columns are `reason`/`created_at` (not `defect_type`/`recorded_at` — those
    // don't exist and crashed every call). QC-birlashtirish (2026-07-02): new brak records
    // now also land in qc_defects (via ReportDefectCommand) — union both sources.
    const rows = await execSql<{ defect_type: string; cnt: string; qty: string }>(sql`
      SELECT b.reason AS defect_type, COUNT(*) AS cnt, SUM(b.quantity) AS qty
      FROM (
        SELECT reason, quantity::numeric AS quantity, created_at::timestamptz AS created_at FROM qc_braks
        UNION ALL
        SELECT defect_code AS reason, quantity::numeric AS quantity, created_at::timestamptz AS created_at
        FROM qc_defects
        WHERE papka_order_id IS NOT NULL OR brak_date IS NOT NULL OR stage IS NOT NULL
      ) b
      WHERE b.created_at >= date_trunc('day', NOW())
      GROUP BY b.reason
      ORDER BY qty DESC
      LIMIT 5
    `);
    if (!rows.length) return helpReply('✅ Bugun brak qayd etilmagan');
    const lines = rows.map((r) => `  ⚠️ <b>${r.defect_type}</b>: ${r.cnt} ta (${r.qty} dona)`);
    return { text: `🔍 <b>Bugungi Braklar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  /**
   * DPMO (Defects Per Million Opportunities) — standart sanoat formulasi:
   *   DPMO = (jami_defekt / jami_tekshirilgan_birlik) × 1 000 000
   * (1 imkoniyat/birlik — jarayon-xarita bo'yicha nazorat-nuqtalari soni ustuni bazada yo'q,
   * shuning uchun eng sodda, standart variant ishlatildi — Q-40, taxminiy ustun yo'q).
   *
   * Audit 2026-08-07/08: `qc_dpmo_stats` jadvali bazada YO'Q edi — DPMO hech qachon
   * hisoblanmagan (docs/audit/FANTOM-JADVALLAR-2026-08-07.md §B). Haqiqiy manba —
   * `qc_final_inspections` (sample_size/defect_count ustunlari bilan, qc-extended-final
   * .repository.ts orqali yoziladi) — `papka_orders.work_center_id` orqali ish-markaziga
   * bog'lanadi ("process" = ish markazi). Jadval yaratilmadi (Q-35 dan qochish) — jonli
   * agregatsiya bilan hisoblanadi.
   */
  private async getDpmo(): Promise<BotReply> {
    const rows = await execSql<{ process_name: string | null; dpmo: string; total_samples: string }>(sql`
      SELECT wc.name AS process_name,
             SUM(qi.sample_size)::text AS total_samples,
             ROUND((SUM(qi.defect_count)::numeric / NULLIF(SUM(qi.sample_size), 0)) * 1000000, 0)::text AS dpmo
      FROM qc_final_inspections qi
      JOIN papka_orders pk ON pk.id = qi.papka_order_id
      LEFT JOIN work_centers wc ON wc.id = pk.work_center_id
      WHERE qi.inspected_at >= NOW() - INTERVAL '30 days' AND qi.sample_size > 0
      GROUP BY wc.id, wc.name
      HAVING SUM(qi.sample_size) > 0
      ORDER BY (SUM(qi.defect_count)::numeric / SUM(qi.sample_size)) DESC
      LIMIT 3
    `);
    if (!rows.length) return helpReply('📊 So\'nggi 30 kunda yakuniy tekshiruv yozuvlari topilmadi — DPMO hisoblanmadi');
    const lines = rows.map((r) => `  📊 <b>${r.process_name ?? 'Ish markazi belgilanmagan'}</b>: ${r.dpmo} DPMO (${r.total_samples} birlik tekshirilgan)`);
    return { text: `📉 <b>DPMO Ko'rsatkichlari (so'nggi 30 kun, eng yomon 3 ta)</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
