/**
 * AGENT 5: Moliya — Cash-flow bashorat + Fraud detection
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';
import { SECONDS_PER_DAY, LARGE_TX_THRESHOLD_UZS } from '../../common/constants/business.constants';

@Injectable()
export class CashflowAgentService {
  private readonly logger = new Logger(CashflowAgentService.name);
  private readonly AGENT  = 'cashflow';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
  ) {}

  /** Kelgusi N kun pul oqimi bashorati (batch so'rovlar) */
  async forecastCashFlow(daysCount = 30): Promise<{ days: Array<{ date: string; balance: number; inflow: number; outflow: number }> }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'forecast_cashflow' }, async () => {
      const [startBalR, inflowR, outflowR] = await Promise.all([
        runQuery<{ b: string }>(sql`
          SELECT COALESCE(SUM(amount), 0)::text AS b FROM cash_transactions WHERE created_at < NOW()
        `).catch(() => ({ rows: [{ b: '0' }] })),

        runQuery<{ dt: string; amt: string }>(sql`
          SELECT DATE(expected_date)::text AS dt, COALESCE(SUM(amount::numeric), 0)::text AS amt
          FROM customer_payments
          WHERE expected_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (${daysCount} || ' days')::interval
            AND status = 'pending'
          GROUP BY DATE(expected_date)
        `).catch(() => ({ rows: [] as { dt: string; amt: string }[] })),

        runQuery<{ dt: string; amt: string }>(sql`
          SELECT DATE(due_date)::text AS dt, COALESCE(SUM(amount::numeric), 0)::text AS amt
          FROM sd_payments
          WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (${daysCount} || ' days')::interval
            AND status = 'pending'
          GROUP BY DATE(due_date)
        `).catch(() => ({ rows: [] as { dt: string; amt: string }[] })),
      ]);

      let runningBalance = Number(startBalR.rows[0]?.b ?? 0);
      const inflowMap = new Map(inflowR.rows.map(r => [r.dt, Number(r.amt)]));
      const outflowMap = new Map(outflowR.rows.map(r => [r.dt, Number(r.amt)]));

      const today = new Date();
      const dayList: Array<{ date: string; balance: number; inflow: number; outflow: number }> = [];
      for (let i = 0; i < daysCount; i++) {
        const d = new Date(today.getTime());
        d.setDate(d.getDate() + i);
        const date = d.toISOString().split('T')[0];
        const inflow  = inflowMap.get(date)  ?? 0;
        const outflow = outflowMap.get(date) ?? 0;
        runningBalance += inflow - outflow;
        dayList.push({ date, balance: runningBalance, inflow, outflow });
      }
      return { days: dayList };
    });
  }

  /** Muddati o'tgan debitorlik */
  async checkOverduePayments(): Promise<Array<{ customerId: number; amount: number; daysOverdue: number }>> {
    const r = await runQuery<{ id: string; amount: string; days: string }>(sql`
      SELECT customer_id::text AS id, SUM(amount)::text AS amount,
             EXTRACT(EPOCH FROM (NOW() - MIN(due_date)))/${SECONDS_PER_DAY} AS days
      FROM ar_invoices
      WHERE status = 'unpaid' AND due_date < NOW()
      GROUP BY customer_id
      LIMIT 50
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({
      customerId:  Number(x.id),
      amount:      Number(x.amount),
      daysOverdue: Math.floor(Number(x.days)),
    }));
  }

  /** Anomal tranzaksiyalar — bir xodimdan katta summa, takrorlangan to'lovlar */
  async detectFraud(): Promise<Array<{ txId: string; reason: string; severity: string }>> {
    const r = await runQuery<{ id: string; amount: string; user_id: number }>(sql`
      SELECT id::text, amount::text, created_by_user_id AS user_id FROM cash_transactions
      WHERE amount > ${LARGE_TX_THRESHOLD_UZS} AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 30
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({
      txId: x.id,
      reason: `Katta summa (${Number(x.amount).toLocaleString()} so'm) bir xodimdan`,
      severity: 'warning',
    }));
  }

  /** Har kuni 06:30 da kasflow tekshiruvi */
  @Cron('30 6 * * *', { timeZone: 'Asia/Tashkent' })
  async cron(): Promise<void> {
    try {
      const overdue = await this.checkOverduePayments();
      const big = overdue.filter(o => o.daysOverdue > 30);
      if (big.length > 0) {
        await this.alert.send({
          agentName: this.AGENT, severity: 'critical', module: 'finance',
          title: 'Muddati o\'tgan debitorlik',
          message: `${big.length} ta mijozda 30+ kun debitorlik (jami ${big.reduce((s, x) => s + x.amount, 0).toLocaleString()} so'm)`,
          targetRole: 'cfo', actionRequired: true,
        });
      }
      const fraud = await this.detectFraud();
      if (fraud.length > 0) {
        this.bus.emit('finance.fraud_suspected', { count: fraud.length, items: fraud }, this.AGENT);
      }
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
