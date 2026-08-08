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
import { MAX_FAILED_LOGIN_ATTEMPTS } from '@common/constants/security.constants';

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
    // Audit 2026-08-07: bu so'rovda IKKI bo'shliq bor edi va ikkalasi ham signalni butunlay
    // o'chirib qo'yardi (Q-40 — "xavfsizlik agenti ishlayapti" degan taassurot):
    //   (a) 'auth_audit_log' jadvali bazada YO'Q -> '.catch' xatoni yutardi;
    //   (b) undan ham muhimi, 'login_failed' harakati loyihada HECH QAYERGA YOZILMAYDI
    //       (grep -rn "login_failed" -> 0 moslik). Ya'ni jadval yaratilganda ham bo'sh qolardi.
    // Haqiqiy manba — login oqimining o'zi: 'users.failed_login_attempts' va 'users.locked_until'
    // (login.service.ts:188 + drizzle-auth.repo.ts:223 aynan shularni yozadi/o'qiydi).
    // Chegara ham o'sha bitta konstantadan olinadi, aks holda agent va login qulfi bir-biriga
    // zid ishlardi ("bir joyda tuzatilib, qo'shnilari unutilgan" naqshi).
    const r = await runQuery<{ user_id: number; cnt: string }>(sql`
      SELECT id AS user_id, failed_login_attempts::text AS cnt
      FROM users
      WHERE failed_login_attempts >= ${MAX_FAILED_LOGIN_ATTEMPTS}
        AND (locked_until IS NULL OR locked_until > NOW())
      ORDER BY failed_login_attempts DESC
      LIMIT 50
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
