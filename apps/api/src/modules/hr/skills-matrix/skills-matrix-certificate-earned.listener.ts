/**
 * @module skills-matrix-certificate-earned.listener
 * @description Wave 4 round-3 (PA2-18): canonical CQRS
 *   `@EventsHandler(CertificateEarnedEvent)` form. Extracted from
 *   `skills-matrix.service.ts` so the skills-matrix side of the
 *   `training.certificate.earned` fan-out subscribes directly to the event
 *   class rather than the legacy `HrV2Events.CERTIFICATE_EARNED` string topic.
 *   EventBridge keeps re-emitting to the legacy string topic for the
 *   remaining non-migrated consumer (`gamification.service`) — see
 *   EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   No production code currently publishes this event on the CQRS bus;
 *   the listener is therefore a no-op at runtime until a publisher is
 *   wired — same dead-letter state as the legacy @OnEvent listener was
 *   previously in.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SkillsMatrixService } from './skills-matrix.service';
import { CertificateEarnedEvent } from '../domain/events/certificate-earned.event';

@Injectable()
@EventsHandler(CertificateEarnedEvent)
export class SkillsMatrixCertificateEarnedListener
  implements IEventHandler<CertificateEarnedEvent>
{
  private readonly logger = new Logger(SkillsMatrixCertificateEarnedListener.name);

  constructor(private readonly skills: SkillsMatrixService) {}

  async handle(event: CertificateEarnedEvent): Promise<void> {
    const { employeeId, skillCode, level } = event.props;
    if (!skillCode) return;
    try {
      await this.skills.upsertSkillScore({
        employeeId,
        skillCode,
        currentLevel: level ?? 3,
      });
      this.logger.log(`Auto-updated skill ${skillCode} for employee ${employeeId}`);
    } catch (err) {
      this.logger.warn(
        `[CertificateEarned] skill upsert failed for employee ${employeeId} / ${skillCode}: ${(err as Error).message}`,
      );
    }
  }
}
