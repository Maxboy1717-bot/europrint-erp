/**
 * @module logistics.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';


@Injectable()
export class LogisticsBotService {
  private readonly logger = new Logger(LogisticsBotService.name);
  readonly botName = 'logistics_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('logistics', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/vehicles'   || msg.text.toLowerCase().includes('avtomobil')) return this.getVehicles();
    if (cmd === '/deliveries' || msg.text.toLowerCase().includes('yetkazish')) return this.getPendingDeliveries();

    return helpReply('🚚 Logistika Bot:\n/vehicles — Avtomobillar holati\n/deliveries — Kutayotgan yetkazish');
  }

  private async getVehicles(): Promise<BotReply> {
    const rows = await execSql<{ plate: string; status: string; driver: string }>(sql`
      -- Audit 2026-08-07: fleet_vehicles jadvali BAZADA YO'Q; kanonik avtopark jadvali
      -- mm_vehicles (ustun nomlari aynan mos: plate_number / status / driver_name).
      SELECT plate_number AS plate, status, driver_name AS driver
      FROM mm_vehicles
      ORDER BY status
      LIMIT 8
    `);
    if (!rows.length) return helpReply('🚗 Avtomobil ma\'lumoti yo\'q');
    const lines = rows.map((r) => `  🚗 <b>${r.plate}</b> — ${r.status} (${r.driver ?? 'N/A'})`);
    return { text: `🚚 <b>Avtomobillar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getPendingDeliveries(): Promise<BotReply> {
    const rows = await execSql<{ order_number: string; customer: string; status: string }>(sql`
      SELECT o.order_number, c.company_name AS customer, o.status
      FROM sales_orders o
      LEFT JOIN crm_companies c ON c.id = o.customer_id
      WHERE o.status IN ('SHIPPING','PRODUCTION_SCHEDULED')
      ORDER BY o.delivery_deadline
      LIMIT 5
    `);
    if (!rows.length) return helpReply('✅ Kutayotgan yetkazish yo\'q');
    const lines = rows.map((r) => `  📦 <b>${r.order_number}</b> → ${r.customer} [${r.status}]`);
    return { text: `📦 <b>Kutayotgan Yetkazish</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
