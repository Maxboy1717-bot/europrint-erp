/**
 * Communication Center — Hujjat repository (CRUD + workflow state mutations)
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import { castTo } from '@common/db-rows';
import type { BasketState, Priority, Language, WorkflowState } from '../../domain/types';

export interface DocumentRow {
  id:                string;
  documentNumber:    string;
  templateId:        string;
  templateVersion:   number;
  senderUserId:      number;
  branchId:          string | null;

  basketState:       BasketState;
  basketOwnerUserId: number | null;
  basketEnteredAt:   string;
  isInboxOverdue:    boolean;

  workflowState:     WorkflowState;
  currentStepOrder:  number;

  subject:           string;
  aiBody:            string;
  aiAnswers:         Record<string, unknown>;
  senderComment:     string | null;
  priority:          Priority;
  language:          Language;

  parentDocumentId:  string | null;
  version:           number;

  cancelledByUserId: number | null;
  cancelledReason:   string | null;
  cancelledAt:       string | null;

  createdAt:         string;
  updatedAt:         string;
  archivedAt:        string | null;
}

export interface TemplateRow {
  id:               string;
  code:             string;
  nameUz:           string;
  nameRu:           string;
  category:         string;
  version:          number;
  isActive:         boolean;
  defaultPriority:  Priority;
  numberFormat:     string;
  inboxSlaHours:    number;
  reminderHours:    number;
  escalationHours:  number;
}

export interface WorkflowStepRow {
  id:                   string;
  templateId:           string;
  templateVersion:      number;
  stepOrder:            number;
  stepType:             'sequential' | 'parallel';
  approverPositionCode: string;
  rejectionStops:       boolean;
  timeLimitHours:       number;
  isMandatory:          boolean;
}

export interface CreateDraftInput {
  templateId:    string;
  senderUserId:  number;
  subject:       string;
  aiBody:        string;
  aiAnswers:     Record<string, unknown>;
  senderComment: string | null;
  priority:      Priority;
  language:      Language;
  branchId:      string | null;
  documentNumber: string;
  templateVersion: number;
}

@Injectable()
export class CcDocumentsRepository {
  private readonly logger = new Logger(CcDocumentsRepository.name);

  // ── Templates / steps ────────────────────────────────────────────────
  async getTemplate(templateId: string): Promise<Result<TemplateRow | null>> {
    try {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT
          id::text             AS id,
          code, name_uz        AS "nameUz",
          name_ru              AS "nameRu",
          category,
          version, is_active   AS "isActive",
          default_priority     AS "defaultPriority",
          number_format        AS "numberFormat",
          inbox_sla_hours      AS "inboxSlaHours",
          reminder_hours       AS "reminderHours",
          escalation_hours     AS "escalationHours"
        FROM cc_document_templates WHERE id = ${templateId} LIMIT 1
      `);
      return Ok(r.rows[0] ? castTo<TemplateRow>(r.rows[0]) : null);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async getStepsForTemplate(templateId: string, version: number): Promise<Result<WorkflowStepRow[]>> {
    try {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT
          id::text                 AS id,
          template_id::text        AS "templateId",
          template_version         AS "templateVersion",
          step_order               AS "stepOrder",
          step_type                AS "stepType",
          approver_position_code   AS "approverPositionCode",
          rejection_stops          AS "rejectionStops",
          time_limit_hours         AS "timeLimitHours",
          is_mandatory             AS "isMandatory"
        FROM cc_workflow_steps
        WHERE template_id = ${templateId} AND template_version = ${version}
        ORDER BY step_order ASC
      `);
      return Ok(castTo<WorkflowStepRow[]>(r.rows));
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  // ── Documents ────────────────────────────────────────────────────────
  async getById(documentId: string): Promise<Result<DocumentRow | null>> {
    try {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT
          id::text                            AS id,
          document_number                     AS "documentNumber",
          template_id::text                   AS "templateId",
          template_version                    AS "templateVersion",
          sender_user_id                      AS "senderUserId",
          branch_id::text                     AS "branchId",
          basket_state                        AS "basketState",
          basket_owner_user_id                AS "basketOwnerUserId",
          basket_entered_at                   AS "basketEnteredAt",
          is_inbox_overdue                    AS "isInboxOverdue",
          workflow_state                      AS "workflowState",
          current_step_order                  AS "currentStepOrder",
          subject,
          ai_body                             AS "aiBody",
          ai_answers                          AS "aiAnswers",
          sender_comment                      AS "senderComment",
          priority, language,
          parent_document_id::text            AS "parentDocumentId",
          version,
          cancelled_by_user_id                AS "cancelledByUserId",
          cancelled_reason                    AS "cancelledReason",
          cancelled_at                        AS "cancelledAt",
          created_at                          AS "createdAt",
          updated_at                          AS "updatedAt",
          archived_at                         AS "archivedAt"
        FROM cc_documents WHERE id = ${documentId} LIMIT 1
      `);
      return Ok(r.rows[0] ? castTo<DocumentRow>(r.rows[0]) : null);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Yangi qoralama yaratadi (draft, basket=outbox, workflow=draft, owner=sender) */
  async createDraft(input: CreateDraftInput): Promise<Result<DocumentRow>> {
    try {
      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_documents (
          document_number, template_id, template_version, sender_user_id, branch_id,
          basket_state, basket_owner_user_id, basket_entered_at,
          workflow_state, current_step_order,
          subject, ai_body, ai_answers, sender_comment, priority, language
        )
        VALUES (
          ${input.documentNumber}, ${input.templateId}, ${input.templateVersion}, ${input.senderUserId}, ${input.branchId},
          'outbox', ${input.senderUserId}, NOW(),
          'draft', 0,
          ${input.subject}, ${input.aiBody}, ${JSON.stringify(input.aiAnswers)}::jsonb,
          ${input.senderComment}, ${input.priority}, ${input.language}
        )
        RETURNING id::text AS id
      `);
      const created = await this.getById(r.rows[0].id);
      if (!created.ok) return Err(created.error);
      if (!created.data) return Err({ message: 'Yaratilgan qoralamani o\'qib bo\'lmadi', code: 'DB_ERROR' });
      return Ok(created.data);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Hujjatni keyingi savatga + workflow holatga o'tkazish (atomic, audit yozuvi bilan)
   */
  async transition(args: {
    documentId:        string;
    newBasketState:    BasketState;
    newBasketOwnerId:  number | null;
    newWorkflowState:  WorkflowState;
    newCurrentStep:    number;
    actorUserId:       number;
    auditAction:       string;     // 'sent' | 'approved' | 'rejected' | 'cancelled' | 'resubmitted' | etc.
    auditComment:      string | null;
  }): Promise<Result<void>> {
    try {
      return await db.transaction(async () => {
        // current state'ni audit uchun olamiz
        const before = await runQuery<{
          basket_state: BasketState; workflow_state: WorkflowState;
        }>(sql`
          SELECT basket_state, workflow_state
          FROM cc_documents WHERE id = ${args.documentId}
          FOR UPDATE
        `);
        const cur = before.rows[0];
        if (!cur) return Err({ message: 'Hujjat topilmadi', code: 'NOT_FOUND' });

        await runQuery(sql`
          UPDATE cc_documents
          SET basket_state         = ${args.newBasketState},
              basket_owner_user_id = ${args.newBasketOwnerId},
              basket_entered_at    = NOW(),
              is_inbox_overdue     = false,
              workflow_state       = ${args.newWorkflowState},
              current_step_order   = ${args.newCurrentStep},
              updated_at           = NOW()
          WHERE id = ${args.documentId}
        `);

        await runQuery(sql`
          INSERT INTO cc_basket_history (document_id, owner_user_id, from_basket, to_basket, moved_by_user_id, note)
          VALUES (${args.documentId}, ${args.newBasketOwnerId}, ${cur.basket_state}, ${args.newBasketState}, ${args.actorUserId}, ${args.auditComment})
        `);

        await runQuery(sql`
          INSERT INTO cc_audit_trail
            (document_id, action, from_basket, to_basket, from_workflow, to_workflow, performed_by_user_id, comment)
          VALUES
            (${args.documentId}, ${args.auditAction},
             ${cur.basket_state}, ${args.newBasketState},
             ${cur.workflow_state}, ${args.newWorkflowState},
             ${args.actorUserId}, ${args.auditComment})
        `);
        return Ok(undefined);
      });
    } catch (e) {
      this.logger.error(`transition: ${(e as Error).message}`);
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Tasdiqlash yozuvini yaratish (kutish holatida) */
  async createApproval(args: {
    documentId:     string;
    stepOrder:      number;
    approverUserId: number;
    deadlineHours:  number;
    rejectionStops: boolean;
  }): Promise<Result<string>> {
    try {
      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_approvals
          (document_id, step_order, approver_user_id, state, deadline_at, rejection_stops)
        VALUES
          (${args.documentId}, ${args.stepOrder}, ${args.approverUserId},
           'pending', NOW() + (${args.deadlineHours} || ' hours')::interval,
           ${args.rejectionStops})
        RETURNING id::text AS id
      `);
      return Ok(r.rows[0].id);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Tasdiqlash yozuvini imzolash (state'ni o'zgartirish + signature_hash) */
  async signApproval(args: {
    approvalId:        string;
    state:             'approved' | 'rejected' | 'delegated' | 'escalated';
    signatureHash:     string;
    rejectionReasonId: string | null;
    comment:           string | null;
  }): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE cc_approvals
        SET state               = ${args.state},
            signed_at           = NOW(),
            signature_hash      = ${args.signatureHash},
            rejection_reason_id = ${args.rejectionReasonId},
            comment             = ${args.comment},
            updated_at          = NOW()
        WHERE id = ${args.approvalId}
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Joriy bosqichdagi pending approvals — parallel bosqichda hammasi qaytariladi,
   * sequential da bitta.
   */
  async getPendingApprovalsAtStep(documentId: string, stepOrder: number): Promise<Result<{
    id: string; approverUserId: number; state: string; rejectionStops: boolean;
  }[]>> {
    try {
      const r = await runQuery<{
        id: string; approver_user_id: number; state: string; rejection_stops: boolean;
      }>(sql`
        SELECT id::text AS id, approver_user_id, state, rejection_stops
        FROM cc_approvals
        WHERE document_id = ${documentId} AND step_order = ${stepOrder}
      `);
      return Ok(r.rows.map(x => ({
        id: x.id, approverUserId: x.approver_user_id,
        state: x.state, rejectionStops: x.rejection_stops,
      })));
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Bekor qilish (sender) */
  async cancel(args: {
    documentId: string; cancelledByUserId: number; reason: string;
  }): Promise<Result<void>> {
    try {
      const before = await runQuery<{
        basket_state: BasketState; workflow_state: WorkflowState; sender_user_id: number;
      }>(sql`
        SELECT basket_state, workflow_state, sender_user_id
        FROM cc_documents WHERE id = ${args.documentId} FOR UPDATE
      `);
      const cur = before.rows[0];
      if (!cur) return Err({ message: 'Hujjat topilmadi', code: 'NOT_FOUND' });
      if (cur.sender_user_id !== args.cancelledByUserId) {
        return Err({ message: 'Faqat yuboruvchi bekor qila oladi', code: 'FORBIDDEN' });
      }

      await runQuery(sql`
        UPDATE cc_documents
        SET workflow_state       = 'cancelled',
            basket_state         = 'outbox',
            basket_owner_user_id = sender_user_id,
            basket_entered_at    = NOW(),
            cancelled_by_user_id = ${args.cancelledByUserId},
            cancelled_reason     = ${args.reason},
            cancelled_at         = NOW(),
            updated_at           = NOW()
        WHERE id = ${args.documentId}
      `);

      await runQuery(sql`
        INSERT INTO cc_audit_trail (document_id, action, from_basket, to_basket, from_workflow, to_workflow, performed_by_user_id, comment)
        VALUES (${args.documentId}, 'cancelled', ${cur.basket_state}, 'outbox', ${cur.workflow_state}, 'cancelled', ${args.cancelledByUserId}, ${args.reason})
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Yangi versiya yozuvi (qayta yuborishda) */
  async snapshotVersion(args: {
    documentId: string; version: number; aiBody: string; senderComment: string | null; createdByUserId: number;
  }): Promise<Result<void>> {
    try {
      await runQuery(sql`
        INSERT INTO cc_document_versions (document_id, version, ai_body, sender_comment, created_by_user_id)
        VALUES (${args.documentId}, ${args.version}, ${args.aiBody}, ${args.senderComment}, ${args.createdByUserId})
        ON CONFLICT (document_id, version) DO NOTHING
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Hujjat tanasini yangilash (qayta yuborishdan oldin) */
  async updateBody(args: {
    documentId: string; aiBody: string; senderComment: string | null; newVersion: number;
  }): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE cc_documents
        SET ai_body        = ${args.aiBody},
            sender_comment = ${args.senderComment},
            version        = ${args.newVersion},
            updated_at     = NOW()
        WHERE id = ${args.documentId}
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Shikoyat (faqat direktorga) */
  async createComplaint(args: {
    documentId: string; complainantUserId: number; reason: string;
  }): Promise<Result<string>> {
    try {
      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_complaints (document_id, complainant_user_id, reason)
        VALUES (${args.documentId}, ${args.complainantUserId}, ${args.reason})
        RETURNING id::text AS id
      `);
      return Ok(r.rows[0].id);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** Chop etish jurnali */
  async logPrint(args: {
    documentId: string; printedByUserId: number; reason: string;
  }): Promise<Result<void>> {
    try {
      await runQuery(sql`
        INSERT INTO cc_print_log (document_id, printed_by_user_id, reason)
        VALUES (${args.documentId}, ${args.printedByUserId}, ${args.reason})
      `);
      await runQuery(sql`
        INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, print_reason)
        VALUES (${args.documentId}, 'printed', ${args.printedByUserId}, ${args.reason})
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
