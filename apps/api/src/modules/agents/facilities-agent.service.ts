/**
 * AGENT 13: Xo'jalik — kommunal + texnik xizmat + ofis materiallar
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { SECONDS_PER_DAY } from '../../common/constants/business.constants';

@Injectable()
export class FacilitiesAgentService {
  private readonly logger = new Logger(FacilitiesAgentService.name);
  private readonly AGENT  = 'facilities';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
  ) {}

  /** Kommunal to'lovlar trend — real ma'lumot mro_utility_readings jadvalidan */
  async trackUtilityBills(month: string): Promise<{ electricity: number; gas: number; water: number; deltaPct: number }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'utility_bills' }, async () => {
      const r = await runQuery<{ utility_type: string; month_total: string; trend_percent: string }>(sql`
        SELECT utility_type, month_total::text, trend_percent::text
        FROM mro_utility_readings
        WHERE ${month ? sql`reading_date LIKE ${month + '%'}` : sql`TRUE`}
        ORDER BY reading_date DESC
      `).catch(() => ({ rows: [] }));

      const byType = new Map<string, { total: number; trend: number }>();
      for (const row of r.rows) {
        const type = row.utility_type?.toLowerCase() ?? '';
        if (!byType.has(type)) {
          byType.set(type, { total: Number(row.month_total ?? 0), trend: Number(row.trend_percent ?? 0) });
        }
      }

      const trends = Array.from(byType.values()).map(v => v.trend);
      const deltaPct = trends.length > 0 ? trends.reduce((a, b) => a + b, 0) / trends.length : 0;

      return {
        electricity: byType.get('electricity')?.total ?? 0,
        gas: byType.get('gas')?.total ?? 0,
        water: byType.get('water')?.total ?? 0,
        deltaPct,
      };
    });
  }

  /** Profilaktik texnik xizmat jadvali */
  async schedulePreventiveMaintenance(): Promise<Array<{ machineId: string; nextMaintenanceAt: string; daysLeft: number }>> {
    const r = await runQuery<{ id: string; next_at: string; days: string }>(sql`
      SELECT id::text, next_maintenance_at::text, EXTRACT(EPOCH FROM (next_maintenance_at - NOW()))/${SECONDS_PER_DAY} AS days
      FROM machines WHERE next_maintenance_at IS NOT NULL AND next_maintenance_at < NOW() + INTERVAL '14 days'
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({ machineId: x.id, nextMaintenanceAt: x.next_at, daysLeft: Math.floor(Number(x.days)) }));
  }

  /** Ofis materiallar holati — real ma'lumot mro_items jadvalidan */
  async monitorOfficeSupplies(): Promise<{ low: number; out: number }> {
    const r = await runQuery<{ low: string; out: string }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE current_stock > 0 AND current_stock <= min_stock) AS low,
        COUNT(*) FILTER (WHERE current_stock <= 0) AS out
      FROM mro_items
    `).catch(() => ({ rows: [{ low: '0', out: '0' }] }));
    return { low: Number(r.rows[0]?.low ?? 0), out: Number(r.rows[0]?.out ?? 0) };
  }

  @Cron('0 7 * * 1', { timeZone: 'Asia/Tashkent' })   // Dushanba 07:00
  async weeklyCron(): Promise<void> {
    try {
      const maint = await this.schedulePreventiveMaintenance();
      if (maint.length > 0) {
        await this.alert.send({
          agentName: this.AGENT, severity: 'info', module: 'facilities',
          title: 'Texnik xizmat jadvali', message: `${maint.length} ta mashinada 14 kun ichida xizmat kerak`,
          targetRole: 'admin',
        });
      }
    } catch (err) { this.logger.error(`weeklyCron: ${(err as Error).message}`); }
  }
}
