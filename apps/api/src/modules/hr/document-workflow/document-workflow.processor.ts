/**
 * @module document-workflow.processor
 * @description Wave 4 round-3 (PA2-18): canonical CQRS
 *   `@EventsHandler` form for the HR document lifecycle. Migrated from the
 *   legacy `@OnEvent(HrV2Events.DOCUMENT_*)` string topics. Each listener now
 *   lives in its own class — DI on the original processor's collaborators is
 *   preserved (db, EventEmitter2) since payroll-side effects still need to
 *   emit `OFFBOARDING_STARTED` on the legacy bus until those consumers
 *   migrate.
 *
 *   Three event classes:
 *     - DocumentSubmittedEvent  → DocumentSubmittedHandler
 *     - DocumentApprovedEvent   → DocumentApprovedHandler
 *     - DocumentRejectedEvent   → DocumentRejectedHandler
 *
 *   EventBridge keeps re-emitting to the legacy string topics for
 *   non-migrated consumers (gamification.service, telegram-bots.service) —
 *   see EVENT_NAME_MAP entries in event-bridge.service.ts.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, and, count, asc, sql } from 'drizzle-orm';
import {
  hr_documents, document_approval_steps,
  offboarding_cases, offboarding_checklist_items,
  payroll_advances, payroll_deductions,
} from '@shared/db';
import { employees } from '@shared/db';
import { HrV2Events } from '../events/hr-v2-events';
import { DocumentSubmittedEvent } from '../domain/events/document-submitted.event';
import { DocumentApprovedEvent } from '../domain/events/document-approved.event';
import { DocumentRejectedEvent } from '../domain/events/document-rejected.event';

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// DocumentSubmittedEvent — auto-approve if no steps configured, otherwise
// route to the first approver.
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(DocumentSubmittedEvent)
export class DocumentSubmittedHandler
  implements IEventHandler<DocumentSubmittedEvent>
{
  private readonly logger = new Logger(DocumentSubmittedHandler.name);

  async handle(event: DocumentSubmittedEvent): Promise<void> {
    const { documentId, documentType } = event.props;
    this.logger.log(`Processing document submission: #${documentId} (${documentType})`);
    try {
      const [{ stepCount }] = await db
        .select({ stepCount: count() })
        .from(document_approval_steps)
        .where(eq(document_approval_steps.documentId, documentId));

      if (Number(stepCount) === 0) {
        await db
          .update(hr_documents)
          .set({ status: 'approved', updated_at: _time.now() })
          .where(eq(hr_documents.id, documentId));
        this.logger.log(`Document #${documentId} auto-approved (no approval steps configured)`);
      } else {
        const [firstStep] = await db
          .select({ id: document_approval_steps.id, approverId: document_approval_steps.approverId })
          .from(document_approval_steps)
          .where(eq(document_approval_steps.documentId, documentId))
          .orderBy(asc(document_approval_steps.stepNumber))
          .limit(1);
        if (firstStep) {
          this.logger.log(`Document #${documentId} awaiting approval from approver #${firstStep.approverId}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to process document #${documentId}: ${err}`);
    }
  }
}

// ---------------------------------------------------------------------------
// DocumentApprovedEvent — once every step has been approved, fan out to
// payroll side-effects (offboarding case, advance, discipline fine).
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(DocumentApprovedEvent)
export class DocumentApprovedHandler
  implements IEventHandler<DocumentApprovedEvent>
{
  private readonly logger = new Logger(DocumentApprovedHandler.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async handle(event: DocumentApprovedEvent): Promise<void> {
    const { documentId } = event.props;
    this.logger.log(`Document #${documentId} approved — checking remaining steps`);
    try {
      const [{ pendingCount }] = await db
        .select({ pendingCount: count() })
        .from(document_approval_steps)
        .where(and(
          eq(document_approval_steps.documentId, documentId),
          eq(document_approval_steps.status, 'pending'),
        ));

      if (Number(pendingCount) === 0) {
        this.logger.log(`Document #${documentId} all steps complete — triggering payroll hooks`);
        await this.handlePayrollEvents(documentId);
      }
    } catch (err) {
      this.logger.error(`Approval processor error for #${documentId}: ${err}`);
    }
  }

  private async handlePayrollEvents(documentId: number): Promise<void> {
    try {
      const [doc] = await db
        .select()
        .from(hr_documents)
        .where(and(eq(hr_documents.id, documentId), eq(hr_documents.status, 'approved')))
        .limit(1);
      if (!doc) return;
      const employeeId = doc.employeeId;
      if (employeeId == null) {
        this.logger.warn(`Hujjat #${documentId} da employeeId yo'q — ish haqi hodisalari o'tkazib yuborildi`);
        return;
      }

      const meta = doc.content
        ? (typeof doc.content === 'string' ? JSON.parse(doc.content as string) : doc.content) as Row
        : {} as Row;

      if (doc.documentType === 'DISMISSAL_ORDER') {
        const dismissalType = String(meta?.dismissalType ?? meta?.dismissal_type ?? 'termination');
        const lastWorkingDay = (meta?.lastWorkingDay ?? meta?.last_working_day ?? null) as string | null;

        const existingCases = await db
          .select({ id: offboarding_cases.id })
          .from(offboarding_cases)
          .where(and(
            eq(offboarding_cases.employee_id, employeeId),
            eq(offboarding_cases.status, 'active'),
          ))
          .limit(1);

        let caseId: number;

        if (existingCases.length) {
          caseId = existingCases[0].id;
          this.logger.log(`Offboarding case already exists for employee #${doc.employeeId}: case #${caseId}`);
        } else {
          const [newCase] = await db
            .insert(offboarding_cases)
            .values({
              employee_id: employeeId,
              dismissal_type: dismissalType,
              last_working_day: lastWorkingDay ?? undefined,
              dismiss_order_doc_id: documentId,
              status: 'active',
              total_items: 8,
              completed_items: 0,
            })
            .returning({ id: offboarding_cases.id });
          caseId = newCase.id;

          const defaultItems = [
            { item_key: 'exit_interview',     label: "Chiqish suhbati o'tkazildi",                  order_num: 1 },
            { item_key: 'work_handover',      label: 'Ish topshirish (voris xodimga)',               order_num: 2 },
            { item_key: 'equipment_returned', label: 'Jihozlar qaytarildi (kompyuter, texnika)',     order_num: 3 },
            { item_key: 'id_card_returned',   label: 'Korporativ ID karta qaytarildi',               order_num: 4 },
            { item_key: 'erp_access_revoked', label: 'ERP va tizim kirishlari bloklandi',            order_num: 5 },
            { item_key: 'nda_reviewed',       label: "NDA va maxfiylik shartnomasi ko'rib chiqildi", order_num: 6 },
            { item_key: 'settlement_done',    label: "To'liq hisob-kitob amalga oshirildi",          order_num: 7 },
            { item_key: 'final_document',     label: "Ishdan bo'shatish buyrug'i rasmiylashtirildi", order_num: 8 },
          ];
          for (const item of defaultItems) {
            await db
              .insert(offboarding_checklist_items)
              .values({ case_id: caseId, item_key: item.item_key, label: item.label, done: false, order_num: item.order_num })
              .onConflictDoNothing();
          }

          try {
            await db
              .update(employees)
              .set({ status: 'offboarding' as 'terminated', updated_at: _time.now() })
              .where(and(
                sql`id = ${doc.employeeId}`,
                eq(employees.status, 'active'),
              ));
          } catch (statusErr) {
            this.logger.warn(`[DISMISSAL_ORDER] Could not set employee #${doc.employeeId} status to offboarding: ${statusErr instanceof Error ? statusErr.message : String(statusErr)}`);
          }

          this.eventEmitter.emit(HrV2Events.OFFBOARDING_STARTED, {
            caseId, employeeId: doc.employeeId, documentId, dismissalType, lastWorkingDay,
          });

          this.logger.log(`Offboarding case #${caseId} created for employee #${doc.employeeId}`);
        }
      }

      if (doc.documentType === 'ADVANCE_REQUEST') {
        const amount = Number(meta?.amount ?? meta?.advance_amount ?? 0);
        if (amount > 0) {
          await db
            .insert(payroll_advances)
            .values({
              employee_id: employeeId,
              amount: String(amount),
              request_date: _time.now().toISOString().split('T')[0],
              status: 'approved',
              document_id: documentId,
              approved_at: _time.now(),
            })
            .onConflictDoNothing();
          this.logger.log(`Payroll advance created for employee #${doc.employeeId}: ${amount} UZS`);
        }
      }

      if (doc.documentType === 'DISCIPLINE_NOTICE') {
        const fineAmount = Number(meta?.fine_amount ?? meta?.fineAmount ?? 0);
        const finePercent = Number(meta?.fine_percent ?? meta?.finePercent ?? 0);
        if (fineAmount > 0 || finePercent > 0) {
          await db
            .insert(payroll_deductions)
            .values({
              employee_id: employeeId,
              deduction_type: 'DISCIPLINE_FINE',
              amount: String(fineAmount),
              fine_percent: String(finePercent),
              reason: String(meta?.violation_name ?? 'Intizom buzilishi'),
              document_id: documentId,
              status: 'pending',
              deduction_month: castTo<string>(sql`DATE_TRUNC('month', CURRENT_DATE)`),
            })
            .onConflictDoNothing();
          this.logger.log(`Payroll deduction created for employee #${doc.employeeId}: fine=${fineAmount} UZS (${finePercent}%)`);
        }
      }

    } catch (err) {
      this.logger.error(`Payroll event handler error for document #${documentId}: ${err}`);
    }
  }
}

// ---------------------------------------------------------------------------
// DocumentRejectedEvent — flip status to 'rejected' (unless already in a
// terminal state).
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(DocumentRejectedEvent)
export class DocumentRejectedHandler
  implements IEventHandler<DocumentRejectedEvent>
{
  private readonly logger = new Logger(DocumentRejectedHandler.name);

  async handle(event: DocumentRejectedEvent): Promise<void> {
    const { documentId, rejectionReason } = event.props;
    this.logger.log(`Document #${documentId} rejected: ${rejectionReason}`);
    try {
      await db
        .update(hr_documents)
        .set({ status: 'rejected', updated_at: _time.now() })
        .where(and(
          eq(hr_documents.id, documentId),
          sql`${hr_documents.status} NOT IN ('approved', 'rejected')`,
        ));
    } catch (err) {
      this.logger.error(`Rejection processor error for #${documentId}: ${err}`);
    }
  }
}

// Back-compat aggregate class — the module still imports
// `DocumentWorkflowProcessor`; expose the three handlers via a sentinel
// container so the providers array continues to work.
@Injectable()
export class DocumentWorkflowProcessor {
  // Marker only — actual logic lives in the three @EventsHandler classes
  // above. Kept to avoid breaking module imports while round-3 lands.
}
