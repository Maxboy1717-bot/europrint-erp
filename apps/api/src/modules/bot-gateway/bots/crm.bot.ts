/**
 * @module crm.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';
export type { BotMessage, BotReply };


@Injectable()
export class CrmBotService {
  private readonly logger = new Logger(CrmBotService.name);
  readonly botName = 'crm_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('crm', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/funnel' || msg.text.toLowerCase().includes('voronka')) return this.getFunnel();
    if (cmd === '/leads'  || msg.text.toLowerCase().includes('lid'))     return this.getLeads();

    return helpReply('📊 CRM Bot buyruqlari:\n/funnel — Sotuv voronkasi\n/leads — Yangi lidlar');
  }

  private async getFunnel(): Promise<BotReply> {
    const rows = await execSql<{ status: string; cnt: string }>(sql`
      -- Audit 2026-08-07: crm_opportunities jadvali BAZADA YO'Q; kanonik bitim manbai
      -- crm_deals (VIEW; yozish uchun deals bazaviy jadvali — bu yerda faqat o'qish).
      SELECT status, COUNT(*) AS cnt
      FROM crm_deals
      GROUP BY status
      ORDER BY cnt DESC
      LIMIT 10
    `);
    if (!rows.length) return helpReply('📭 Voronka ma\'lumotlari yo\'q');

    const lines = rows.map((r) => `  <b>${r.status}</b>: ${r.cnt} ta`);
    return { text: `📊 <b>Sotuv Voronkasi</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getLeads(): Promise<BotReply> {
    const rows = await execSql<{ contact_name: string; source: string; status: string }>(sql`
      SELECT contact_name, source, status
      FROM crm_leads
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
    if (!rows.length) return helpReply('📭 Lidlar yo\'q');

    const lines = rows.map((r) => `  • <b>${r.contact_name}</b> [${r.source}] — ${r.status}`);
    return { text: `📋 <b>So'nggi Lidlar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
