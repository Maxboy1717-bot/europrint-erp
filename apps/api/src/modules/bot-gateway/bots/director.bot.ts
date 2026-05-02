import { Injectable, Logger } from '@nestjs/common';
import { execSql, helpReply, deniedReply, hasBotPermission, sql } from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';

/* Director bot is restricted to executive-level roles only */

@Injectable()
export class DirectorBotService {
  private readonly logger = new Logger(DirectorBotService.name);
  readonly botName = 'director_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('director', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/kpi'     || msg.text.toLowerCase().includes('kpi'))         return this.getKpi();
    if (cmd === '/ai'      || msg.text.toLowerCase().includes('ai qaror'))    return this.getAiStats();
    if (cmd === '/summary' || msg.text.toLowerCase().includes('xulosa'))      return this.getSummary();

    return helpReply('📊 Director Bot:\n/kpi — KPI\n/ai — AI qarorlar\n/summary — Xulosa');
  }

  private async getKpi(): Promise<BotReply> {
    const rows = await execSql<{ metric_name: string; value: string; target: string }>(sql`
      SELECT metric_name, value, target
      FROM kpi_metrics
      WHERE period = TO_CHAR(NOW(), 'YYYY-MM')
      ORDER BY metric_name
      LIMIT 6
    `);
    if (!rows.length) return helpReply('📊 KPI ma\'lumotlari yo\'q');
    const lines = rows.map((r) => {
      const pct  = r.target ? Math.round((Number(r.value) / Number(r.target)) * 100) : 0;
      const icon = pct >= 100 ? '✅' : pct >= 80 ? '⚠️' : '❌';
      return `  ${icon} <b>${r.metric_name}</b>: ${r.value} / ${r.target} (${pct}%)`;
    });
    return { text: `📊 <b>KPI</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getAiStats(): Promise<BotReply> {
    const rows = await execSql<{ agent_code: string; total: string; auto_count: string; override_count: string }>(sql`
      SELECT agent_code,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE auto_executed = true)         AS auto_count,
             COUNT(*) FILTER (WHERE human_override IS NOT NULL)   AS override_count
      FROM ai_decision_log
      WHERE created_at >= date_trunc('day', NOW())
      GROUP BY agent_code
      ORDER BY total DESC
    `);
    if (!rows.length) return helpReply('🤖 Bugun AI qaror yo\'q');
    const lines = rows.map((r) => `  🤖 <b>${r.agent_code}</b>: ${r.total} ta (${r.auto_count} avto, ${r.override_count} manual)`);
    return { text: `🤖 <b>Bugungi AI Qarorlar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getSummary(): Promise<BotReply> {
    const [orders, employees, aiDecisions] = await Promise.all([
      execSql<{ cnt: string }>(sql`SELECT COUNT(*) AS cnt FROM sales_orders WHERE created_at >= date_trunc('month',NOW())`, [{ cnt: '0' }]),
      execSql<{ cnt: string }>(sql`SELECT COUNT(*) AS cnt FROM employees WHERE LOWER(status) = 'active'`, [{ cnt: '0' }]),
      execSql<{ cnt: string }>(sql`SELECT COUNT(*) AS cnt FROM ai_decision_log WHERE created_at >= date_trunc('day',NOW())`, [{ cnt: '0' }]),
    ]);

    return helpReply(
      `📋 <b>Kunlik Xulosa</b>\n  📦 Bu oy buyurtmalar: ${orders[0].cnt} ta\n  👥 Faol xodimlar: ${employees[0].cnt} nafar\n  🤖 Bugun AI qarorlari: ${aiDecisions[0].cnt} ta`,
    );
  }
}
