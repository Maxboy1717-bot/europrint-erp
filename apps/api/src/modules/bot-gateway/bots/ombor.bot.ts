/**
 * @module ombor.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';


@Injectable()
export class OmborBotService {
  private readonly logger = new Logger(OmborBotService.name);
  readonly botName = 'ombor_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('ombor', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/lowstock' || msg.text.toLowerCase().includes('kam')) return this.getLowStock();
    if (cmd === '/orders'   || msg.text.toLowerCase().includes('buyurtma')) return this.getPendingOrders();

    return helpReply('📦 Ombor Bot:\n/lowstock — Kam qoldiqli materiallar\n/orders — Kutayotgan buyurtmalar');
  }

  private async getLowStock(): Promise<BotReply> {
    const rows = await execSql<{ name: string; qty: string; unit: string; min_qty: string }>(sql`
      SELECT name, current_qty AS qty, unit, min_qty
      FROM warehouse_materials
      WHERE current_qty <= min_qty
      ORDER BY (current_qty::float / NULLIF(min_qty,0)) ASC
      LIMIT 6
    `);
    if (!rows.length) return helpReply('✅ Barcha materiallar yetarli');
    const lines = rows.map((r) => `  ⚠️ <b>${r.name}</b>: ${r.qty}/${r.min_qty} ${r.unit}`);
    return { text: `📉 <b>Kam Qoldiqli Materiallar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getPendingOrders(): Promise<BotReply> {
    const rows = await execSql<{ order_number: string; status: string; total_amount: string }>(sql`
      SELECT order_number, status, total_amount
      FROM mm_purchase_orders
      WHERE status IN ('DRAFT','SENT','PARTIAL')
      ORDER BY created_at DESC
      LIMIT 5
    `);
    if (!rows.length) return helpReply('✅ Kutayotgan xarid yo\'q');
    const lines = rows.map((r) => `  📋 <b>${r.order_number}</b> [${r.status}]: ${Number(r.total_amount).toLocaleString('uz')} UZS`);
    return { text: `🛒 <b>Kutayotgan Xaridlar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
