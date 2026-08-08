/**
 * @module hr-offboarding-cc.listener
 * @description Owner decision 2026-07-13 (chat): HR employee exit/termination should also
 *   reach Communication Center (CC) as an official CONTRACT_END document — previously the
 *   only CcSpawnRequestedEvent emitter in the whole codebase was POS/procurement
 *   (procurement-request.service.ts). This listener subscribes to the SAME
 *   `HrV2Events.OFFBOARDING_STARTED` legacy EventEmitter2 topic already emitted by
 *   `HrOffboardingService.createCase` (and by `document-workflow.processor.ts`'s
 *   DISMISSAL_ORDER auto-flow) and spawns a CC document reusing the EXISTING
 *   `CONTRACT_END` template ("Mehnat shartnomasini bekor qilish") — no new template row
 *   needed, it already matches this exact concern (Q-40: reuse, don't duplicate).
 *
 *   senderUserId = payload.initiatedBy — the real authenticated actor who opened the case
 *   (`HrOffboardingController.createCase` always passes `user?.id`). The
 *   document-workflow.processor.ts emitter does not carry `initiatedBy` — the CC spawn is
 *   skipped (best-effort, Q-40 no fabrication) rather than guessing an actor for that path.
 *
 *   Failures are caught + logged, never thrown back to the event bus — a CC hiccup must not
 *   break the offboarding case creation it is reacting to.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventBus } from '@nestjs/cqrs';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { HrV2Events } from '../events/hr-v2-events';
import { CcSpawnRequestedEvent } from '../../communication-center/domain/events/cc-spawn-requested.event';

interface OffboardingStartedPayload {
  caseId: number;
  employeeId: number;
  dismissalType?: string;
  initiatedBy?: number;
  lastWorkingDay?: string;
}

interface EmployeeNameRow {
  first_name: string | null;
  last_name: string | null;
}

@Injectable()
export class HrOffboardingCcListener {
  private readonly logger = new Logger(HrOffboardingCcListener.name);

  constructor(private readonly eventBus: EventBus) {}

  @OnEvent(HrV2Events.OFFBOARDING_STARTED)
  async onOffboardingStarted(payload: OffboardingStartedPayload): Promise<void> {
    try {
      await this._spawnCcDocument(payload);
    } catch (error: unknown) {
      this.logger.error(
        { caseId: payload?.caseId, error: (error as Error)?.message ?? String(error) },
        'HrOffboardingCcListener: CC spawn failed (non-fatal)',
      );
    }
  }

  private async _spawnCcDocument(payload: OffboardingStartedPayload): Promise<void> {
    if (payload?.initiatedBy == null) {
      this.logger.log(
        { caseId: payload?.caseId, employeeId: payload?.employeeId },
        'HrOffboardingCcListener: no initiatedBy on this emitter path (Q-40: no fabrication) — CC spawn skipped',
      );
      return;
    }

    const nameRows = await runQuery<EmployeeNameRow>(sql`
      SELECT first_name, last_name FROM employees WHERE id = ${payload.employeeId}
    `);
    const emp = nameRows.rows[0];
    const employeeName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() : '';

    this.eventBus.publish(new CcSpawnRequestedEvent({
      templateCode: 'CONTRACT_END',
      senderUserId: payload.initiatedBy,
      subject: `Mehnat shartnomasini bekor qilish — xodim${employeeName ? ` ${employeeName}` : ` #${payload.employeeId}`}`,
      body:
        `Offboarding case #${payload.caseId} ochildi` +
        (payload.dismissalType ? ` (turi: ${payload.dismissalType})` : '') +
        (payload.lastWorkingDay ? `. Oxirgi ish kuni: ${payload.lastWorkingDay}` : '') + '.',
      priority: 'normal',
      metadata: { caseId: payload.caseId, employeeId: payload.employeeId, dismissalType: payload.dismissalType ?? null },
    }));

    this.logger.log(
      { caseId: payload.caseId, employeeId: payload.employeeId },
      'HrOffboardingCcListener: CC document (CONTRACT_END) spawned',
    );
  }
}
