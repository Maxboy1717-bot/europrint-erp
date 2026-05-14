/**
 * AGENT 9: Xavfsizlik monitoring
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';

@Injectable()
export class SecurityAgentService {
  private readonly logger = new Logger(SecurityAgentService.name);
  private readonly AGENT  = 'security';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
  ) {}

  /** Noto'g'ri parol urinishlari */
  async monitorAccessAttempts(): Promise<{ failedTotal: number; blockedUsers: number[] }> {
    const r = await runQuery<{ user_id: number; cnt: string }>(sql`
      SELECT user_id, COUNT(*)::text AS cnt FROM auth_audit_log
      WHERE action = 'login_failed' AND created_at > NOW() - INTERVAL '1 hour'
      GROUP BY user_id HAVING COUNT(*) >= 5
    `).catch(() => ({ rows: [] }));
    const blocked = r.rows.map(x => x.user_id);
    if (blocked.length > 0) {
      await this.alert.send({
        agentName: this.AGENT, severity: 'critical', module: 'security',
        title: 'Login urinishlar', message: `${blocked.length} ta hisob 5+ marta noto'g'ri parol kiritdi`,
        targetRole: 'admin',
      });
    }
    return { failedTotal: r.rows.reduce((s, x) => s + Number(x.cnt), 0), blockedUsers: blocked };
  }

  /** Audit log anomaliya tahlili — agent xatolari + autentifikatsiya muvaffaqiyatsizliklari */
  async analyzeAuditLog(): Promise<{ agentErrors: number; authFailures: number; anomalies: number }> {
    const [agentR, authR] = await Promise.all([
      // Agent xatolari (agents_audit_log)
      runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM agents_audit_log
        WHERE success = false AND created_at > NOW() - INTERVAL '24 hours'
      `).catch(() => ({ rows: [{ c: '0' }] })),

      // Login muvaffaqiyatsizliklari (audit_logs)
      runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM audit_logs
        WHERE action ILIKE '%login%fail%' AND created_at > NOW() - INTERVAL '24 hours'
      `).catch(() => ({ rows: [{ c: '0' }] })),
    ]);

    const agentErrors  = Number(agentR.rows[0]?.c ?? 0);
    const authFailures = Number(authR.rows[0]?.c ?? 0);
    return { agentErrors, authFailures, anomalies: agentErrors + authFailures };
  }

  /** Favqulodda holat protokoli */
  async emergencyProtocol(incidentType: string, details: string): Promise<void> {
    await this.alert.send({
      agentName: this.AGENT, severity: 'urgent', module: 'security',
      title: `🚨 FAVQULODDA: ${incidentType}`, message: details,
      targetRole: 'admin',
    });
    this.bus.emit('security.emergency', { incidentType, details }, this.AGENT);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cron(): Promise<void> {
    try {
      await this.monitorAccessAttempts();
      await this.analyzeAuditLog();
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
