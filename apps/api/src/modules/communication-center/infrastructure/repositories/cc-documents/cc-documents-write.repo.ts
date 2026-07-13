/**
 * @module cc-documents/cc-documents-write.repo
 * @description Mutating queries: createDraft / transition / approve / reject /
 *   cancel / version snapshot / body update / complaint / print log.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - INSERT ... RETURNING id::text AS id (typed text cast on returned UUID)
 *   - JSONB inline cast (${JSON.stringify(...)}::jsonb)
 *   - ON CONFLICT (document_id, version) DO NOTHING (composite-key upsert)
 *   - SELECT ... FOR UPDATE (pessimistic row lock inside transaction)
 *   - Inline interval arithmetic (NOW() + (${hours} || ' hours')::interval)
 *   - Multi-statement audit trail writes inside db.transaction with
 *     same-row UPDATE referencing prior column value (sender_user_id)
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import type { DocumentRow, CreateDraftInput, CcTemplateAdminRow, CreateTemplateInput, UpdateTemplateInput } from './types';
import type { BasketState, WorkflowState } from '../../../domain/types';
import { CcDocumentsReadRepo } from './cc-documents-read.repo';

@Injectable()
export class CcDocumentsWriteRepo {
  private readonly logger = new Logger(CcDocumentsWriteRepo.name);
  constructor(private readonly reader: CcDocumentsReadRepo) {}

  async createDraft(input: CreateDraftInput): Promise<Result<DocumentRow>> {
    try {
      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_documents (
          document_number, template_id, template_version, sender_user_id, branch_id,
          basket_state, basket_owner_user_id, basket_entered_at,
          workflow_state, current_step_order,
          subject, ai_body, ai_answers, sender_comment, priority, language,
          parent_document_id, ai_draft
        )
        VALUES (
          ${input.documentNumber}, ${input.templateId}, ${input.templateVersion}, ${input.senderUserId}, ${input.branchId},
          'outbox', ${input.senderUserId}, NOW(),
          'draft', 0,
          ${input.subject}, ${input.aiBody}, ${JSON.stringify(input.aiAnswers)}::jsonb,
          ${input.senderComment}, ${input.priority}, ${input.language},
          ${input.parentDocumentId}, ${input.aiDraft ?? false}
        )
        RETURNING id::text AS id
      `);
      const insertedRow = r.rows[0];
      if (!insertedRow) return Err({ message: 'Qoralama yaratilmadi', code: 'DB_ERROR' });
      const created = await this.reader.getById(insertedRow.id);
      if (!created.ok) return Err(created.error);
      if (!created.data) return Err({ message: 'Yaratilgan qoralamani o\'qib bo\'lmadi', code: 'DB_ERROR' });
      return Ok(created.data);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async transition(args: {
    documentId: string;
    newBasketState: BasketState;
    newBasketOwnerId: number | null;
    newWorkflowState: WorkflowState;
    newCurrentStep: number;
    actorUserId: number;
    auditAction: string;
    auditComment: string | null;
  }): Promise<Result<void>> {
    try {
      return await db.transaction(async () => {
        const before = await runQuery<{ basket_state: BasketState; workflow_state: WorkflowState }>(sql`
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

  async createApproval(args: {
    documentId: string; stepOrder: number; approverUserId: number;
    deadlineHours: number; rejectionStops: boolean;
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
      const row = r.rows[0];
      if (!row) return Err({ message: 'Tasdiq yaratilmadi', code: 'DB_ERROR' });
      return Ok(row.id);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async signApproval(args: {
    approvalId: string;
    state: 'approved' | 'rejected' | 'delegated' | 'escalated';
    signatureHash: string;
    rejectionReasonId: string | null;
    comment: string | null;
    /** 20-cc#89: majburiy — qaysi hujjatga asoslanib qaror qilinganini yozadi. */
    referenceDocumentNumber?: string;
  }): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE cc_approvals
        SET state               = ${args.state},
            signed_at           = NOW(),
            signature_hash      = ${args.signatureHash},
            rejection_reason_id = ${args.rejectionReasonId},
            comment             = ${args.comment},
            reference_document_number = ${args.referenceDocumentNumber ?? null},
            updated_at          = NOW()
        WHERE id = ${args.approvalId}
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /** 20-cc#47: huquqiy belgi — faqat ERP web GET yozadi, birinchi ko'rishdan keyin o'zgarmaydi. */
  async markViewed(documentId: string, via: string): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE cc_documents SET viewed_at = NOW(), viewed_via = ${via}
        WHERE id = ${documentId} AND viewed_at IS NULL
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async cancel(args: { documentId: string; cancelledByUserId: number; reason: string }): Promise<Result<void>> {
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

  async createComplaint(args: {
    documentId: string; complainantUserId: number; reason: string;
  }): Promise<Result<string>> {
    try {
      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_complaints (document_id, complainant_user_id, reason)
        VALUES (${args.documentId}, ${args.complainantUserId}, ${args.reason})
        RETURNING id::text AS id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Shikoyat yaratilmadi', code: 'DB_ERROR' });
      return Ok(row.id);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

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

  /**
   * Append a standalone cc_audit_trail row (no state transition). Used for events
   * that must be journalled but do not move the document — e.g. CC #21
   * self_route_blocked (SoD: sender resolved as their own approver) and CC #3
   * approver_unresolved. performedByUserId is nullable (system-generated events).
   */
  async logAudit(args: {
    documentId: string; action: string; performedByUserId?: number | null; comment?: string | null;
  }): Promise<Result<void>> {
    try {
      await runQuery(sql`
        INSERT INTO cc_audit_trail (document_id, action, performed_by_user_id, comment)
        VALUES (${args.documentId}, ${args.action}, ${args.performedByUserId ?? null}, ${args.comment ?? null})
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Insert a cc_notifications row. cc_notifications is a VIEW over `notifications`
   * whose NOT NULL columns are title + body, so we supply title := titleUz and
   * body := messageUz alongside the localized columns (same shape as cc-sla.cron's
   * pushNotification). Used to proactively alert a user (e.g. CC #3: the sender when
   * routing is unresolvable, so the document does not silently deadlock).
   */
  async notifyUser(args: {
    userId: number; documentId: string; type: string;
    titleUz: string; titleRu: string; messageUz: string; messageRu: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<Result<void>> {
    try {
      await runQuery(sql`
        INSERT INTO cc_notifications
          (user_id, document_id, type, priority, title_uz, title_ru, message_uz, message_ru, title, body)
        VALUES
          (${args.userId}, ${args.documentId}, ${args.type}, ${args.priority ?? 'normal'},
           ${args.titleUz}, ${args.titleRu}, ${args.messageUz}, ${args.messageRu}, ${args.titleUz}, ${args.messageUz})
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  // ─── Templates admin (super_admin only — owner decision 2026-07-13) ──────
  // NOTE: `version` is never written here (create defaults it via the column's
  // own DEFAULT 1; update never touches it) — it is a workflow-routing key
  // (cc_workflow_steps.template_version, resolved live in cc-workflow.service.ts
  // at draft-creation time) owned by a separate versioning flow. Bumping it on a
  // plain metadata edit would silently orphan new drafts from their approval steps.

  async createTemplate(input: CreateTemplateInput): Promise<Result<CcTemplateAdminRow>> {
    try {
      const dup = await runQuery<{ id: string }>(sql`
        SELECT id FROM cc_document_templates WHERE code = ${input.code} LIMIT 1
      `);
      if (dup.rows[0]) return Err({ message: `Shablon kodi band: ${input.code}`, code: 'CONFLICT' });

      const r = await runQuery<{ id: string }>(sql`
        INSERT INTO cc_document_templates (
          code, name_uz, name_ru, category, ai_questions, html_template,
          default_priority, max_file_size_mb, allowed_file_types, print_requires_reason,
          cooldown_days, archive_after_days, number_format,
          inbox_sla_hours, reminder_hours, escalation_hours,
          is_recurring, cron_expression, test_mode, is_active
        )
        VALUES (
          ${input.code}, ${input.nameUz}, ${input.nameRu}, ${input.category},
          ${JSON.stringify(input.aiQuestions ?? [])}::jsonb, ${input.htmlTemplate ?? null},
          ${input.defaultPriority ?? 'normal'}, ${input.maxFileSizeMb ?? 10},
          ${JSON.stringify(input.allowedFileTypes ?? ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx'])}::jsonb,
          ${input.printRequiresReason ?? true}, ${input.cooldownDays ?? null},
          ${input.archiveAfterDays ?? null}, ${input.numberFormat ?? 'DOC-{YYYY}-{SEQ}'},
          ${input.inboxSlaHours ?? 24}, ${input.reminderHours ?? 20}, ${input.escalationHours ?? 48},
          ${input.isRecurring ?? false}, ${input.cronExpression ?? null}, ${input.testMode ?? false},
          ${input.isActive ?? true}
        )
        RETURNING id::text AS id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Shablon yaratilmadi', code: 'DB_ERROR' });
      const created = await this.reader.getTemplateAdmin(row.id);
      if (!created.ok) return Err(created.error);
      if (!created.data) return Err({ message: 'Yaratilgan shablonni o\'qib bo\'lmadi', code: 'DB_ERROR' });
      return Ok(created.data);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  async updateTemplate(templateId: string, patch: UpdateTemplateInput): Promise<Result<CcTemplateAdminRow>> {
    try {
      const existing = await this.reader.getTemplateAdmin(templateId);
      if (!existing.ok) return Err(existing.error);
      if (!existing.data) return Err({ message: 'Shablon topilmadi', code: 'NOT_FOUND' });

      if (patch.code && patch.code !== existing.data.code) {
        const dup = await runQuery<{ id: string }>(sql`
          SELECT id FROM cc_document_templates WHERE code = ${patch.code} AND id != ${templateId} LIMIT 1
        `);
        if (dup.rows[0]) return Err({ message: `Shablon kodi band: ${patch.code}`, code: 'CONFLICT' });
      }

      await runQuery(sql`
        UPDATE cc_document_templates SET
          code                  = COALESCE(${patch.code ?? null}, code),
          name_uz               = COALESCE(${patch.nameUz ?? null}, name_uz),
          name_ru               = COALESCE(${patch.nameRu ?? null}, name_ru),
          category              = COALESCE(${patch.category ?? null}, category),
          ai_questions          = COALESCE(${patch.aiQuestions ? JSON.stringify(patch.aiQuestions) : null}::jsonb, ai_questions),
          html_template         = COALESCE(${patch.htmlTemplate ?? null}, html_template),
          default_priority      = COALESCE(${patch.defaultPriority ?? null}, default_priority),
          max_file_size_mb      = COALESCE(${patch.maxFileSizeMb ?? null}, max_file_size_mb),
          allowed_file_types    = COALESCE(${patch.allowedFileTypes ? JSON.stringify(patch.allowedFileTypes) : null}::jsonb, allowed_file_types),
          print_requires_reason = COALESCE(${patch.printRequiresReason ?? null}, print_requires_reason),
          cooldown_days         = COALESCE(${patch.cooldownDays ?? null}, cooldown_days),
          archive_after_days    = COALESCE(${patch.archiveAfterDays ?? null}, archive_after_days),
          number_format         = COALESCE(${patch.numberFormat ?? null}, number_format),
          inbox_sla_hours       = COALESCE(${patch.inboxSlaHours ?? null}, inbox_sla_hours),
          reminder_hours        = COALESCE(${patch.reminderHours ?? null}, reminder_hours),
          escalation_hours      = COALESCE(${patch.escalationHours ?? null}, escalation_hours),
          is_recurring          = COALESCE(${patch.isRecurring ?? null}, is_recurring),
          cron_expression       = COALESCE(${patch.cronExpression ?? null}, cron_expression),
          test_mode             = COALESCE(${patch.testMode ?? null}, test_mode),
          is_active             = COALESCE(${patch.isActive ?? null}, is_active),
          updated_at            = NOW()
        WHERE id = ${templateId}
      `);

      const updated = await this.reader.getTemplateAdmin(templateId);
      if (!updated.ok) return Err(updated.error);
      if (!updated.data) return Err({ message: 'Yangilangan shablonni o\'qib bo\'lmadi', code: 'DB_ERROR' });
      return Ok(updated.data);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }

  /**
   * Soft-delete (is_active = false) — NOT a hard DELETE. cc_documents / cc_ai_sessions
   * reference cc_document_templates(id) without ON DELETE CASCADE (only
   * cc_rejection_reasons / cc_workflow_steps cascade), so a hard delete on any
   * template that already has documents would throw a FK violation, and even where
   * it wouldn't, it would destroy history. `listTemplates` (GET /cc/templates)
   * already filters `WHERE is_active = true`, so this is exactly equivalent to
   * "remove from the template list" without breaking existing document references.
   */
  async deleteTemplate(templateId: string): Promise<Result<CcTemplateAdminRow>> {
    try {
      const existing = await this.reader.getTemplateAdmin(templateId);
      if (!existing.ok) return Err(existing.error);
      if (!existing.data) return Err({ message: 'Shablon topilmadi', code: 'NOT_FOUND' });

      await runQuery(sql`
        UPDATE cc_document_templates SET is_active = false, updated_at = NOW()
        WHERE id = ${templateId}
      `);

      const updated = await this.reader.getTemplateAdmin(templateId);
      if (!updated.ok) return Err(updated.error);
      if (!updated.data) return Err({ message: 'Shablonni o\'qib bo\'lmadi', code: 'DB_ERROR' });
      return Ok(updated.data);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
