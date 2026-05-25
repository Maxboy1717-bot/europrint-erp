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
import type { DocumentRow, CreateDraftInput } from './types';
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
}
