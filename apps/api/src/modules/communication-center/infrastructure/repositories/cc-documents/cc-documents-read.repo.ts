/**
 * @module cc-documents/cc-documents-read.repo
 * @description Read-only document/template/step queries.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import { castTo } from '@common/db-rows';
import type { DocumentRow, TemplateRow, WorkflowStepRow, CcTemplateAdminRow } from './types';

@Injectable()
export class CcDocumentsReadRepo {
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

  /**
   * Full-column template read for the super_admin-only template CRUD (owner decision
   * 2026-07-13). Distinct from `getTemplate` above (narrower projection used by the
   * live document/workflow path) — this backs create/update/delete round-trips in
   * CcDocumentsWriteRepo.
   */
  async getTemplateAdmin(templateId: string): Promise<Result<CcTemplateAdminRow | null>> {
    try {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT
          id::text              AS id,
          code, name_uz         AS "nameUz",
          name_ru               AS "nameRu",
          category,
          ai_questions          AS "aiQuestions",
          html_template         AS "htmlTemplate",
          version,
          is_active             AS "isActive",
          default_priority      AS "defaultPriority",
          max_file_size_mb      AS "maxFileSizeMb",
          allowed_file_types    AS "allowedFileTypes",
          print_requires_reason AS "printRequiresReason",
          cooldown_days         AS "cooldownDays",
          archive_after_days    AS "archiveAfterDays",
          number_format         AS "numberFormat",
          inbox_sla_hours       AS "inboxSlaHours",
          reminder_hours        AS "reminderHours",
          escalation_hours      AS "escalationHours",
          is_recurring          AS "isRecurring",
          cron_expression       AS "cronExpression",
          test_mode             AS "testMode",
          created_at            AS "createdAt",
          updated_at            AS "updatedAt"
        FROM cc_document_templates WHERE id = ${templateId} LIMIT 1
      `);
      return Ok(r.rows[0] ? castTo<CcTemplateAdminRow>(r.rows[0]) : null);
    } catch (e) {
      return Err({ message: (e as Error).message, code: 'DB_ERROR' });
    }
  }
}
