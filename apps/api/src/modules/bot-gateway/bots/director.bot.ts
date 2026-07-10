/**
 * @module director.bot
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  execSqlResult, helpReply, deniedReply, dbErrorReply,
  hasBotPermission, sql,
} from './bot.helpers';
import type { BotMessage, BotReply } from './bot.helpers';

/* Director bot is restricted to executive-level roles only */

@Injectable()
export class DirectorBotService {
  private readonly logger = new Logger(DirectorBotService.name);
  readonly botName = 'director_bot';

  async handle(msg: BotMessage): Promise<BotReply> {
    if (!hasBotPermission('director', msg.role)) return deniedReply(msg.role);

    const cmd = (msg.command ?? '').toLowerCase();

    if (cmd === '/holat'   || msg.text.toLowerCase().includes('holat'))       return this.getHolat();
    if (cmd === '/kpi'     || msg.text.toLowerCase().includes('kpi'))         return this.getKpi();
    if (cmd === '/ai'      || msg.text.toLowerCase().includes('ai qaror'))    return this.getAiStats();
    if (cmd === '/summary' || msg.text.toLowerCase().includes('xulosa'))      return this.getSummary();

    return helpReply('📊 Director Bot:\n/holat — Kompaniya holati\n/kpi — KPI\n/ai — AI qarorlar\n/summary — Xulosa');
  }

  private async getHolat(): Promise<BotReply> {
    // vizyon 05-director#18: return the LAST saved company_state_log snapshot
    // (written daily by CompanyStateSnapshotCron @07:00 Asia/Tashkent). Read-only
    // pull of the newest row — state_code is the authoritative qualitative verdict
    // (computed from state_thresholds master-data), score_total the weighted score.
    const res = await execSqlResult<{ state_code: string; score_total: string; snapshot_at: string }>(
      sql`
        SELECT state_code,
               score_total::text AS score_total,
               to_char(detected_at AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD HH24:MI') AS snapshot_at
        FROM company_state_log
        ORDER BY detected_at DESC
        LIMIT 1
      `,
      'director.bot/getHolat',
    );
    if (!res.ok) {
      this.logger.error(`getHolat DB error: ${res.error}`);
      return dbErrorReply();
    }
    const row = res.rows[0];
    if (!row) return helpReply('🏢 Holat ma\'lumotlari hali yo\'q');
    return {
      text:
        `🏢 <b>Kompaniya Holati</b>\n` +
        `  📊 Holat: <b>${row.state_code}</b>\n` +
        `  🎯 Ball: <b>${row.score_total}</b>\n` +
        `  🕖 Saqlangan: ${row.snapshot_at}`,
      parse: 'HTML',
      success: true,
    };
  }

  private async getKpi(): Promise<BotReply> {
    // Canonical KPI source is kpi_definitions JOIN kpi_values (same as the director
    // dashboard). The old query hit a phantom `kpi_metrics` table (does not exist in the
    // live DB) filtered on a NULL `period` column, so /kpi always fell through to a DB
    // error. Take the latest snapshot per active KPI (kpi_values.period is unused/NULL;
    // period_date carries the real date), preferring the value-row's target then the
    // definition's target.
    const res = await execSqlResult<{ metric_name: string; value: string; target: string }>(
      sql`
        SELECT metric_name, value, target FROM (
          SELECT DISTINCT ON (kd.id)
                 kd.kpi_name                                   AS metric_name,
                 kv.value::text                                AS value,
                 COALESCE(kv.target_value, kd.target_value)::text AS target
          FROM kpi_definitions kd
          JOIN kpi_values kv ON kv.kpi_id = kd.id
          WHERE kd.is_active = true
          ORDER BY kd.id, kv.period_date DESC NULLS LAST
        ) t
        ORDER BY metric_name
        LIMIT 6
      `,
      'director.bot/getKpi',
    );
    if (!res.ok) {
      this.logger.error(`getKpi DB error: ${res.error}`);
      return dbErrorReply();
    }
    if (!res.rows.length) return helpReply('📊 KPI ma\'lumotlari yo\'q');
    const lines = res.rows.map((r) => {
      const pct  = r.target ? Math.round((Number(r.value) / Number(r.target)) * 100) : 0;
      const icon = pct >= 100 ? '✅' : pct >= 80 ? '⚠️' : '❌';
      return `  ${icon} <b>${r.metric_name}</b>: ${r.value} / ${r.target} (${pct}%)`;
    });
    return { text: `📊 <b>KPI</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getAiStats(): Promise<BotReply> {
    const res = await execSqlResult<{ agent_code: string; total: string; auto_count: string; override_count: string }>(
      sql`
        SELECT agent_code,
               COUNT(*) AS total,
               COUNT(*) FILTER (WHERE auto_executed = true)         AS auto_count,
               COUNT(*) FILTER (WHERE human_override IS NOT NULL)   AS override_count
        FROM ai_decision_log
        WHERE created_at >= date_trunc('day', NOW())
        GROUP BY agent_code
        ORDER BY total DESC
      `,
      'director.bot/getAiStats',
    );
    if (!res.ok) {
      this.logger.error(`getAiStats DB error: ${res.error}`);
      return dbErrorReply();
    }
    if (!res.rows.length) return helpReply('🤖 Bugun AI qaror yo\'q');
    const lines = res.rows.map((r) => `  🤖 <b>${r.agent_code}</b>: ${r.total} ta (${r.auto_count} avto, ${r.override_count} manual)`);
    return { text: `🤖 <b>Bugungi AI Qarorlar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }

  private async getSummary(): Promise<BotReply> {
    // Use Result-wrapped queries so the director sees an explicit "DB error"
    // instead of a misleading "0 orders / 0 employees" summary.
    const [orders, employees, aiDecisions] = await Promise.all([
      execSqlResult<{ cnt: string }>(
        sql`SELECT COUNT(*) AS cnt FROM sales_orders WHERE created_at >= date_trunc('month',NOW())`,
        'director.bot/getSummary/orders',
      ),
      execSqlResult<{ cnt: string }>(
        sql`SELECT COUNT(*) AS cnt FROM employees WHERE LOWER(status) = 'active'`,
        'director.bot/getSummary/employees',
      ),
      execSqlResult<{ cnt: string }>(
        sql`SELECT COUNT(*) AS cnt FROM ai_decision_log WHERE created_at >= date_trunc('day',NOW())`,
        'director.bot/getSummary/aiDecisions',
      ),
    ]);

    if (!orders.ok || !employees.ok || !aiDecisions.ok) {
      this.logger.error(
        `getSummary partial failure — orders.ok=${orders.ok}, employees.ok=${employees.ok}, aiDecisions.ok=${aiDecisions.ok}`,
      );
      return dbErrorReply();
    }

    const o = Number(orders.rows[0]?.cnt ?? 0);
    const e = Number(employees.rows[0]?.cnt ?? 0);
    const a = Number(aiDecisions.rows[0]?.cnt ?? 0);

    return helpReply(
      `📋 <b>Kunlik Xulosa</b>\n  📦 Bu oy buyurtmalar: ${o.toLocaleString('uz-UZ')} ta\n  👥 Faol xodimlar: ${e.toLocaleString('uz-UZ')} nafar\n  🤖 Bugun AI qarorlari: ${a.toLocaleString('uz-UZ')} ta`,
    );
  }
}
