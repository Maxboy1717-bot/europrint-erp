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
    const rows = await execSql<{ defect_type: string; cnt: string; qty: string }>(sql`
      SELECT defect_type, COUNT(*) AS cnt, SUM(quantity) AS qty
      FROM qc_braks
      WHERE recorded_at >= date_trunc('day', NOW())
      GROUP BY defect_type
      ORDER BY qty DESC
      LIMIT 5
    `);
    if (!rows.length) return helpReply('✅ Bugun brak qayd etilmagan');
    const lines = rows.map((r) => `  ⚠️ <b>${r.defect_type}</b>: ${r.cnt} ta (${r.qty} dona)`);
    return { text: `🔍 <b>Bugungi Braklar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getDpmo(): Promise<BotReply> {
    const rows = await execSql<{ dpmo: string; process_id: string }>(sql`
      SELECT process_id, ROUND(dpmo::numeric, 0) AS dpmo
      FROM qc_dpmo_stats
      ORDER BY calculated_at DESC
      LIMIT 3
    `);
    if (!rows.length) return helpReply('📊 DPMO ma\'lumoti yo\'q');
    const lines = rows.map((r) => `  📊 <b>${r.process_id}</b>: ${r.dpmo} DPMO`);
    return { text: `📉 <b>DPMO Ko'rsatkichlari</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
