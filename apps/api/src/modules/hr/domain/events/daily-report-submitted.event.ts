/**
 * @module daily-report-submitted.event
 * @description Wave 4 round-4 (PA2-18): canonical CQRS event class for the
 *   `daily.report.submitted` topic (HrV2Events.DAILY_REPORT_SUBMITTED).
 *
 *   The `GamificationService.onDailyReportSubmitted` listener was previously
 *   listening via `@OnEvent(HrV2Events.DAILY_REPORT_SUBMITTED)`; the gamification
 *   side-effect is now extracted into a dedicated `DailyReportPointsListener`
 *   that subscribes to this class. EventBridge re-emits to the legacy string
 *   topic for any non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Publisher: DailyReportService.upsertReport (currently emits the legacy
 *   string topic only; EventBridge bridges it back to the CQRS bus once a
 *   publisher is wired in a follow-up migration).
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface DailyReportSubmittedEventProps {
  employeeId: number;
  reportDate?: string;
  reportId?: number;
}

export class DailyReportSubmittedEvent extends DomainEvent {
  constructor(public readonly props: DailyReportSubmittedEventProps) {
    super(String(props.employeeId), 'DailyReportSubmitted');
  }
}
