import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
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
    const rows = await execSql<{ full_name: string; department: string }>(sql`
      SELECT e.full_name, d.name AS department
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE EXTRACT(month FROM e.birth_date) = EXTRACT(month FROM NOW())
        AND EXTRACT(day FROM e.birth_date) = EXTRACT(day FROM NOW())
    `);
    if (!rows.length) return helpReply('🎂 Bugun tug\'ilgan kun yo\'q');
    const lines = rows.map((r) => `  🎉 <b>${r.full_name}</b> — ${r.department}`);
    return { text: `🎂 <b>Bugungi Tug'ilgan Kunlar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getHeadcount(): Promise<BotReply> {
    const rows = await execSql<{ cnt: string }>(sql`
      SELECT COUNT(*) AS cnt FROM employees WHERE status = 'ACTIVE'
    `, [{ cnt: '0' }]);
    return helpReply(`👥 <b>Faol Xodimlar</b>: ${rows[0].cnt} nafar`);
  }
}
