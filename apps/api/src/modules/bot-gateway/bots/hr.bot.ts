/**
 * @module hr.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  execSqlResult, helpReply, deniedReply, dbErrorReply,
  hasBotPermission, sql,
} from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';


@Injectable()
export class HrBotService {
  private readonly logger = new Logger(HrBotService.name);
  readonly botName = 'hr_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('hr', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/birthdays' || msg.text.toLowerCase().includes('tug\'ilgan')) return this.getBirthdays();
    if (cmd === '/headcount' || msg.text.toLowerCase().includes('xodim'))      return this.getHeadcount();

    return helpReply('👥 HR Bot:\n/birthdays — Bugungi tug\'ilgan kunlar\n/headcount — Xodimlar soni');
  }

  private async getBirthdays(): Promise<BotReply> {
    const res = await execSqlResult<{ full_name: string; department: string }>(
      sql`
        SELECT e.full_name, COALESCE(primary_org.dept_name, '') AS department
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE EXTRACT(month FROM e.birth_date) = EXTRACT(month FROM NOW())
          AND EXTRACT(day FROM e.birth_date) = EXTRACT(day FROM NOW())
      `,
      'hr.bot/getBirthdays',
    );
    if (!res.ok) {
      this.logger.error(`getBirthdays DB error: ${res.error}`);
      return dbErrorReply();
    }
    if (!res.rows.length) return helpReply('🎂 Bugun tug\'ilgan kun yo\'q');
    const lines = res.rows.map((r) => `  🎉 <b>${r.full_name}</b> — ${r.department}`);
    return { text: `🎂 <b>Bugungi Tug'ilgan Kunlar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getHeadcount(): Promise<BotReply> {
    // No fallback — if the DB is down the user sees the dbErrorReply, NOT a
    // false "0 active employees" message that they'd mistake for accurate data.
    const res = await execSqlResult<{ cnt: string }>(
      sql`SELECT COUNT(*) AS cnt FROM employees WHERE status = 'ACTIVE'`,
      'hr.bot/getHeadcount',
    );
    if (!res.ok) {
      this.logger.error(`getHeadcount DB error: ${res.error}`);
      return dbErrorReply();
    }
    const count = Number(res.rows[0]?.cnt ?? 0);
    return helpReply(`👥 <b>Faol Xodimlar</b>: ${count.toLocaleString('uz-UZ')} nafar`);
  }
}
