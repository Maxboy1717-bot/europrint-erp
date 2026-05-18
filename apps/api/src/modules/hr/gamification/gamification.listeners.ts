/**
 * @module gamification.listeners
 * @description Wave 4 round-4 (PA2-18): canonical CQRS `@EventsHandler` form
 *   for the three gamification triggers. Extracted from
 *   `gamification.service.ts` so each side-effect subscribes directly to the
 *   typed event class rather than the legacy `HrV2Events.*` string topics:
 *
 *     - DailyReportSubmittedEvent → DailyReportPointsListener (+5 pts)
 *     - DocumentApprovedEvent     → DocumentApprovedPointsListener (+10 pts)
 *     - CertificateEarnedEvent    → CertificateEarnedPointsListener (+50 pts + LEARNER badge)
 *
 *   EventBridge keeps re-emitting to the legacy string topics for non-migrated
 *   consumers (e.g. `telegram-bots.service`) — see EVENT_NAME_MAP entries in
 *   event-bridge.service.ts.
 *
 *   No production code currently publishes these events on the CQRS bus —
 *   each listener was already a dead-letter prior to migration in the sense
 *   that emit sites still use `eventEmitter.emit(HrV2Events.X, payload)`.
 *   EventBridge's reverse path (string topic → CQRS bus) is not yet wired;
 *   typed publishers will be wired in a follow-up step once all consumers
 *   are off the string topic.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { safeCall } from '@common/result';
import { GamificationService } from './gamification.service';
import { DailyReportSubmittedEvent } from '../domain/events/daily-report-submitted.event';
import { DocumentApprovedEvent } from '../domain/events/document-approved.event';
import { CertificateEarnedEvent } from '../domain/events/certificate-earned.event';

// ---------------------------------------------------------------------------
// DailyReportSubmittedEvent — +5 points for "Kunlik hisobot topshirildi"
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(DailyReportSubmittedEvent)
export class DailyReportPointsListener
  implements IEventHandler<DailyReportSubmittedEvent>
{
  private readonly logger = new Logger(DailyReportPointsListener.name);

  constructor(private readonly gamification: GamificationService) {}

  async handle(event: DailyReportSubmittedEvent): Promise<void> {
    const { employeeId } = event.props;
    const result = await safeCall(async () => {
      await this.gamification.awardPoints(
        employeeId,
        5,
        'daily_report',
        'Kunlik hisobot topshirildi',
      );
    });
    if (!result.ok) {
      this.logger.warn(
        `[Gamification] daily-report points failed for employee ${employeeId}: ${result.error.message}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// DocumentApprovedEvent — +10 points for "Hujjat tasdiqlandi"
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(DocumentApprovedEvent)
export class DocumentApprovedPointsListener
  implements IEventHandler<DocumentApprovedEvent>
{
  private readonly logger = new Logger(DocumentApprovedPointsListener.name);

  constructor(private readonly gamification: GamificationService) {}

  async handle(event: DocumentApprovedEvent): Promise<void> {
    const { employeeId } = event.props;
    if (!employeeId) return;
    const result = await safeCall(async () => {
      await this.gamification.awardPoints(
        employeeId,
        10,
        'document_approved',
        'Hujjat tasdiqlandi',
      );
    });
    if (!result.ok) {
      this.logger.warn(
        `[Gamification] document-approved points failed for employee ${employeeId}: ${result.error.message}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// CertificateEarnedEvent — +50 points + LEARNER badge for completing a course
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(CertificateEarnedEvent)
export class CertificateEarnedPointsListener
  implements IEventHandler<CertificateEarnedEvent>
{
  private readonly logger = new Logger(CertificateEarnedPointsListener.name);

  constructor(private readonly gamification: GamificationService) {}

  async handle(event: CertificateEarnedEvent): Promise<void> {
    const { employeeId, certificateName } = event.props;
    const label = certificateName ?? 'Sertifikat olindi';
    const result = await safeCall(async () => {
      await this.gamification.awardPoints(
        employeeId,
        50,
        'certificate_earned',
        `Sertifikat: ${label}`,
      );
      await this.gamification.awardBadge(
        employeeId,
        'LEARNER',
        undefined,
        "O'quvchi sertifikati oldi",
      );
    });
    if (!result.ok) {
      this.logger.warn(
        `[Gamification] certificate-earned points failed for employee ${employeeId}: ${result.error.message}`,
      );
    }
  }
}
