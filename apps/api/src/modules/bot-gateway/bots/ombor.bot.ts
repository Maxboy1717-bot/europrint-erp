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
    // Audit 2026-08-07: `warehouse_materials` jadvali BAZADA YO'Q (`to_regclass` -> null).
    // `execSql` xatoni yutgani uchun bot har doim "Barcha materiallar yetarli" deb javob
    // berardi — ya'ni past qoldiq bo'lsa ham yaxshi xabar aytardi (Q-40). Kanonik manba:
    // `warehouse_stock` + `material_cards` (aynan `PosFifoService.getLowStockMaterials()`
    // ishlatadigan juftlik).
    const rows = await execSql<{ name: string; qty: string; unit: string; min_qty: string }>(sql`
      SELECT COALESCE(mc.xom_ashyo, mc.kod)         AS name,
             COALESCE(ws.available_quantity, 0)     AS qty,
             COALESCE(mc.unit_of_measure, '')       AS unit,
             COALESCE(mc.min_stock, 0)              AS min_qty
      FROM warehouse_stock ws
      JOIN material_cards mc ON mc.id = ws.material_id
      WHERE COALESCE(ws.available_quantity, 0) <= COALESCE(mc.min_stock, 0)
        AND COALESCE(mc.min_stock, 0) > 0
        AND mc.is_active = true
      ORDER BY (COALESCE(ws.available_quantity,0)::float / NULLIF(mc.min_stock,0)) ASC
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
