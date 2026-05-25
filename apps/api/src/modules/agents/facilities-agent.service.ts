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

  /** Kommunal to'lovlar trend */
  async trackUtilityBills(month: string): Promise<{ electricity: number; gas: number; water: number; deltaPct: number }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'utility_bills' }, async () => {
      // Placeholder — real schema'da fi_utility_bills jadval bo'lishi mumkin
      return { electricity: 12_000_000, gas: 4_500_000, water: 1_200_000, deltaPct: 8.5 };
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

  /** Ofis materiallar holati (placeholder) */
  async monitorOfficeSupplies(): Promise<{ low: number; out: number }> {
    return { low: 3, out: 1 };
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
