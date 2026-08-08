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
    if (cmd === '/kundalik'   || msg.text.toLowerCase().includes('kundalik'))   return this.getKundalik();
    if (cmd === '/ideal_rasm' || msg.text.toLowerCase().includes('ideal'))      return this.getIdealRasm();

    return helpReply('📊 Director Bot:\n/holat — Kompaniya holati\n/kpi — KPI\n/ai — AI qarorlar\n/summary — Xulosa\n/kundalik — Oxirgi kundalik\n/ideal_rasm — Strategik maqsadlar');
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

  private async getKundalik(): Promise<BotReply> {
    // Latest director diary entry (diary_entries). Vision 05-director#27.
    // Draft entries may have NULL detail fields — render '—' rather than 'null'.
    const res = await execSqlResult<{
      date: string; daily_state: string | null; main_kpi_value: string | null;
      main_issue: string | null; solution: string | null; tomorrow_plan: string | null;
      status: string | null;
    }>(
      sql`
        SELECT to_char(date, 'YYYY-MM-DD') AS date,
               daily_state,
               main_kpi_value::text        AS main_kpi_value,
               main_issue,
               solution,
               tomorrow_plan,
               status
        FROM diary_entries
        ORDER BY date DESC NULLS LAST, id DESC
        LIMIT 1
      `,
      'director.bot/getKundalik',
    );
    if (!res.ok) {
      this.logger.error(`getKundalik DB error: ${res.error}`);
      return dbErrorReply();
    }
    const row = res.rows[0];
    if (!row) return helpReply('📓 Hali kundalik yozuvi yo\'q');
    const dash = (v: string | null) => (v && v.trim() ? v : '—');
    return {
      text:
        `📓 <b>Oxirgi Kundalik</b> (${row.date})\n` +
        `  🔵 Holat: <b>${dash(row.daily_state)}</b>\n` +
        `  📊 Asosiy KPI: ${dash(row.main_kpi_value)}\n` +
        `  ⚠️ Muammo: ${dash(row.main_issue)}\n` +
        `  ✅ Yechim: ${dash(row.solution)}\n` +
        `  📅 Ertangi reja: ${dash(row.tomorrow_plan)}\n` +
        `  🏷 Status: ${dash(row.status)}`,
      parse: 'HTML',
      success: true,
    };
  }

  private async getIdealRasm(): Promise<BotReply> {
    // Strategic "ideal image" targets (ideal_rasm_targets). Vision 05-director#27.
    // Owner-seeded strategic master-data; empty table → explicit "not entered" reply.
    const res = await execSqlResult<{ target_name: string; target_value: string; unit: string | null; horizon_years: number | null }>(
      sql`
        SELECT target_name,
               target_value::text AS target_value,
               unit,
               horizon_years
        FROM ideal_rasm_targets
        ORDER BY horizon_years NULLS LAST, id
        LIMIT 10
      `,
      'director.bot/getIdealRasm',
    );
    if (!res.ok) {
      this.logger.error(`getIdealRasm DB error: ${res.error}`);
      return dbErrorReply();
    }
    if (!res.rows.length) return helpReply('🎯 <b>Ideal Rasm</b>\nStrategik maqsadlar hali kiritilmagan.');
    const lines = res.rows.map((r) => {
      const unit    = r.unit ? ` ${r.unit}` : '';
      const horizon = r.horizon_years != null ? ` (${r.horizon_years} yil)` : '';
      return `  🎯 <b>${r.target_name}</b>: ${r.target_value}${unit}${horizon}`;
    });
    return { text: `🎯 <b>Ideal Rasm — Strategik Maqsadlar</b>\n${lines.join('\n')}`, parse: 'HTML', success: true };
  }
}
