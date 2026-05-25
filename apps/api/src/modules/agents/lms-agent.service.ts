/**
 * AGENT 11: LMS — o'quv kuzatuv + sertifikat muddati
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { SECONDS_PER_DAY } from '../../common/constants/business.constants';

@Injectable()
export class LmsAgentService {
  private readonly logger = new Logger(LmsAgentService.name);
  private readonly AGENT  = 'lms';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
  ) {}

  /** Xodim o'quv holati */
  async trackProgress(employeeId: number) {
    const r = await runQuery<{ completed: string; total: string }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE status='completed')::text AS completed,
        COUNT(*)::text AS total
      FROM lms_enrollments WHERE user_id = ${employeeId}
    `).catch(() => ({ rows: [{ completed: '0', total: '0' }] }));
    const x = r.rows[0] ?? { completed: '0', total: '0' };
    return { completed: Number(x.completed), total: Number(x.total) };
  }

  /** Sertifikat muddatlari */
  async checkCertificateExpiry(): Promise<Array<{ userId: number; certificateId: number; daysLeft: number }>> {
    const r = await runQuery<{ user_id: number; id: string; days: string }>(sql`
      SELECT user_id, id::text, EXTRACT(EPOCH FROM (expires_at - NOW()))/${SECONDS_PER_DAY} AS days
      FROM lms_certificates WHERE expires_at IS NOT NULL AND expires_at < NOW() + INTERVAL '30 days'
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({ userId: x.user_id, certificateId: Number(x.id), daysLeft: Math.floor(Number(x.days)) }));
  }

  @Cron('0 8 * * *', { timeZone: 'Asia/Tashkent' })
  async cron(): Promise<void> {
    try {
      const expiring = await this.checkCertificateExpiry();
      // Pattern 2: independent alert sends — fire in parallel to avoid N+1 sequential await
      await Promise.all(expiring.map(c => this.alert.send({
        agentName: this.AGENT, severity: c.daysLeft < 7 ? 'critical' : 'warning', module: 'lms',
        title: 'Sertifikat muddati', message: `Sertifikat #${c.certificateId} ${c.daysLeft} kun qoldi`,
        targetUserId: c.userId, actionRequired: true,
      })));
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
