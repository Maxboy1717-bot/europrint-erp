import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';


@Injectable()
export class MesBotService {
  private readonly logger = new Logger(MesBotService.name);
  readonly botName = 'mes_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('mes', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/shift'  || msg.text.toLowerCase().includes('smena'))  return this.getShiftStats();
    if (cmd === '/tasks'  || msg.text.toLowerCase().includes('vazifa')) return this.getPendingTasks();

    return helpReply('🏭 MES Bot:\n/shift — Joriy smena statistikasi\n/tasks — Kutayotgan vazifalar');
  }

  private async getShiftStats(): Promise<BotReply> {
    const rows = await execSql<{ status: string; cnt: string }>(sql`
      SELECT status, COUNT(*) AS cnt
      FROM mes_tasks
      WHERE created_at > NOW() - INTERVAL '12 hours'
      GROUP BY status
    `);
    if (!rows.length) return helpReply('📭 Smena ma\'lumotlari yo\'q');
    const lines = rows.map((r) => `  <b>${r.status}</b>: ${r.cnt}`);
    return { text: `🏭 <b>Joriy Smena (12 soat)</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getPendingTasks(): Promise<BotReply> {
    const rows = await execSql<{ title: string; priority: string }>(sql`
      SELECT title, priority
      FROM mes_tasks
      WHERE status IN ('PENDING','IN_PROGRESS')
      ORDER BY priority DESC
      LIMIT 5
    `);
    if (!rows.length) return helpReply('✅ Barcha vazifalar bajarilgan');
    const lines = rows.map((r) => `  • [${r.priority}] ${r.title}`);
    return { text: `⚡ <b>Faol Vazifalar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
