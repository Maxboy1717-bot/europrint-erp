/**
 * @module production-agent.service
 * @description Production-floor watchdog agent. Periodically scans active
 *   production orders, detects bottlenecks, computes per-machine OEE, and
 *   raises alerts on delays. Sits alongside the more sophisticated
 *   `ai-agents/mes/` agent — this one is a deterministic cron monitor,
 *   no LLM involved.
 *
 *   Three operations:
 *     - `monitorOrders` — count delayed + at-risk production orders
 *     - `calculateOEE`  — per-machine OEE snapshot
 *     - `detectBottleneck` — find slowest work center by queue size
 *
 *   Decisions and alerts go through `AgentAuditService` so they show up
 *   on the Director's AI-Audit panel alongside LLM agent decisions.
 * @layer Service (Agents — scheduled / deterministic)
 *
 * WHY DETERMINISTIC INSTEAD OF LLM-DRIVEN
 *   The production-floor signals are sharp and well-defined:
 *   "due_date < NOW() AND status NOT IN ('done','cancelled')" = delayed.
 *   An LLM would add noise (and cost) without value. Deterministic SQL
 *   is correct, cheap, and auditable.
 *
 *   For nuanced decisions (e.g. "should we rush this customer's order"),
 *   the LLM-based MES Monitor agent in `ai-agents/mes/` takes over —
 *   reading this agent's facts as input.
 *
 * WHY 2-DAY AT-RISK WINDOW
 *   Our average production order takes 1-3 days from start to shipment.
 *   2 days ahead is enough lead time for the planner to reshuffle the
 *   schedule (overtime, swap machines, expedite parts). Shorter windows
 *   leave no action time; longer windows produce too many false alarms.
 *
 * WHY calculateOEE RETURNS HARDCODED 0.92/0.85/0.97 (TODO)
 *   These are placeholder factors until the MES feedback table is
 *   populated. The real implementation will query `mes_machine_logs`
 *   for the actual A × P × Q components. We keep the method to preserve
 *   the API surface; the cron uses it to populate Director dashboards
 *   with at-least-plausible numbers until MES is fully wired.
 *
 *   When MES is ready, replace the body with the actual OEE calc (see
 *   `iot/oee/oee-calculator.service.ts` for the canonical formula).
 *
 * WHY AGENT_NAME IS A CLASS FIELD
 *   `AgentAuditService.wrap()` tags every audit record with the agent
 *   name so the Director panel can filter by agent. Keeping it as a
 *   class field (vs. inline string) makes it consistent across all
 *   methods in this service.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql, and, eq, gte, lte } from 'drizzle-orm';
import { db, downtime_events as downtimeEvents, runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';

@Injectable()
export class ProductionAgentService {
  private readonly logger = new Logger(ProductionAgentService.name);
  private readonly AGENT  = 'production';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
  ) {}

  /** Faol buyurtmalarni tekshirish, kechikish xavfini aniqlash */
  async monitorOrders(): Promise<{ delayed: number; atRisk: number }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'monitor_orders' }, async () => {
      const r = await runQuery<{ delayed: string; at_risk: string }>(sql`
        SELECT
          COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('done','cancelled'))::text AS delayed,
          COUNT(*) FILTER (WHERE due_date < NOW() + INTERVAL '2 days' AND status NOT IN ('done','cancelled'))::text AS at_risk
        FROM production_orders WHERE deleted_at IS NULL
      `).catch(() => ({ rows: [{ delayed: '0', at_risk: '0' }] }));
      const delayed = Number(r.rows[0]?.delayed ?? 0);
      const atRisk  = Number(r.rows[0]?.at_risk ?? 0);
      if (delayed > 0) {
        this.bus.emit('production.delayed', { count: delayed }, this.AGENT);
      }
      return { delayed, atRisk };
    });
  }

  /** OEE — Overall Equipment Effectiveness (mavjudlik × unumdorlik × sifat) */
  async calculateOEE(
    machineId: string,
    dateISO: string,
  ): Promise<{ availability: number; performance: number; quality: number; oee: number; estimated: boolean }> {
    // Availability hisoblash: downtime_events jadvalidan real ma'lumot olish
    // periodStart/end: shu kun 00:00–23:59
    const periodStart = new Date(`${dateISO}T00:00:00Z`);
    const periodEnd   = new Date(`${dateISO}T23:59:59Z`);
    const PERIOD_MINUTES = 24 * 60; // 1440 daqiqa / sutka

    try {
      // M3 (2026-07-05): previously ignored `machineId` entirely, always summing
      // downtime across every work center -- "per-machine OEE" for machine A and
      // machine B returned the identical number. The sole live caller
      // (ProductionDashboard.tsx) always passes machineId=ALL (factory-wide), so
      // that aggregate case is preserved; a real machine id now actually filters.
      const scopeFilter = machineId && machineId.toUpperCase() !== 'ALL'
        ? eq(downtimeEvents.workCenterId, machineId)
        : undefined;
      const rows = await db
        .select({ totalMinutes: sql<string>`COALESCE(SUM(${downtimeEvents.durationMinutes}), 0)` })
        .from(downtimeEvents)
        .where(
          and(
            gte(downtimeEvents.startedAt, periodStart),
            lte(downtimeEvents.startedAt, periodEnd),
            scopeFilter,
          ),
        );
      const downtimeMinutes = Number(rows[0]?.totalMinutes ?? 0);
      const availability = PERIOD_MINUTES > 0
        ? Math.max(0, Math.min(1, (PERIOD_MINUTES - downtimeMinutes) / PERIOD_MINUTES))
        : 0.92;
      // performance + quality: MES telemetry jadvali hali to'liq tayyor emas —
      // ONGOING, DISCLOSED placeholder (see file header "WHY calculateOEE RETURNS
      // HARDCODED 0.92/0.85/0.97" -- real formula needs idealCycleTime/plannedTime
      // inputs that don't exist in any table yet; owner decision needed on source,
      // not a magic-number swap). `estimated: true` lets callers/UI now DISTINGUISH
      // real availability from placeholder performance/quality instead of silently
      // presenting all three as equally real.
      const p = 0.85, q = 0.97;
      const a = Math.round(availability * 100) / 100;
      return { availability: a, performance: p, quality: q, oee: Math.round(a * p * q * 100) / 100, estimated: true };
    } catch (e) {
      this.logger.warn(`OEE calculation failed for machine=${machineId} date=${dateISO}, using defaults: ${(e as Error).message}`);
      const a = 0.92, p = 0.85, q = 0.97;
      return { availability: a, performance: p, quality: q, oee: Math.round(a * p * q * 100) / 100, estimated: true };
    }
  }

  /** Eng sekin ish markazini topish */
  async detectBottleneck(): Promise<{ machineId: string; queueSize: number } | null> {
    const r = await runQuery<{ machine_id: string; queue: string }>(sql`
      SELECT machine_id::text, COUNT(*)::text AS queue FROM production_operations
      WHERE status = 'pending' GROUP BY machine_id ORDER BY queue DESC LIMIT 1
    `).catch(() => ({ rows: [] }));
    return r.rows[0] ? { machineId: r.rows[0].machine_id, queueSize: Number(r.rows[0].queue) } : null;
  }

  /** Smena hisoboti */
  async generateShiftReport(shiftId: string) {
    return this.audit.wrap({ agentName: this.AGENT, action: 'shift_report', targetId: shiftId }, async () => {
      // production_facts jadvalidan yig'amiz
      const r = await runQuery<{ qty: string; defects: string }>(sql`
        SELECT COALESCE(SUM(qty), 0)::text AS qty, COALESCE(SUM(defect_qty), 0)::text AS defects
        FROM production_facts WHERE shift_id = ${shiftId}
      `).catch(() => ({ rows: [{ qty: '0', defects: '0' }] }));
      const qty = Number(r.rows[0]?.qty ?? 0);
      const defects = Number(r.rows[0]?.defects ?? 0);
      const defectPct = qty > 0 ? Math.round((defects / qty) * 1000) / 10 : 0;
      return { shiftId, totalQty: qty, defects, defectPct };
    });
  }

  /** Har 30 daqiqada monitoring */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cron(): Promise<void> {
    try {
      const r = await this.monitorOrders();
      if (r.delayed > 0) {
        await this.alert.send({
          agentName: this.AGENT, severity: 'warning', module: 'production',
          title: 'Kechikkan ishlab chiqarish',
          message: `${r.delayed} ta buyurtma muddati o'tgan, ${r.atRisk} ta xavf ostida.`,
          targetRole: 'prod_head', actionRequired: true,
        });
      }
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
