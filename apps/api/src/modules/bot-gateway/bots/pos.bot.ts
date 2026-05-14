/**
 * @module pos.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';


@Injectable()
export class PosBotService {
  private readonly logger = new Logger(PosBotService.name);
  readonly botName = 'pos_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('pos', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/sales'     || msg.text.toLowerCase().includes('sotuv'))   return this.getDailySales();
    if (cmd === '/inventory' || msg.text.toLowerCase().includes('inventar')) return this.getLowInventory();

    return helpReply('🏪 POS Bot:\n/sales — Bugungi sotuv\n/inventory — Kam inventar');
  }

  private async getDailySales(): Promise<BotReply> {
    const rows = await execSql<{ total: string; count: string }>(sql`
      SELECT SUM(total_amount) AS total, COUNT(*) AS count
      FROM pos_sales
      WHERE sale_date = CURRENT_DATE
    `, [{ total: '0', count: '0' }]);

    const r = rows[0];
    return helpReply(`🏪 <b>Bugungi Sotuv</b>\n  💵 Jami: ${Number(r.total).toLocaleString('uz')} UZS\n  🧾 Tranzaksiyalar: ${r.count} ta`);
  }

  private async getLowInventory(): Promise<BotReply> {
    const rows = await execSql<{ name: string; qty: string }>(sql`
      SELECT name, quantity AS qty
      FROM pos_inventory
      WHERE quantity < min_threshold
      ORDER BY quantity ASC
      LIMIT 5
    `);
    if (!rows.length) return helpReply('✅ Inventar yetarli');
    const lines = rows.map((r) => `  ⚠️ <b>${r.name}</b>: ${r.qty} dona`);
    return { text: `📦 <b>Kam Inventar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
