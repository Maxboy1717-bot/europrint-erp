/**
 * document-workflow-v2.service.ts
 *
 * PRD Q78-81 ga muvofiq Document Workflow Engine (yangi versiya).
 *
 * Foydalanish:
 *   1. Xodim hujjat yozadi (initiate)
 *   2. Avtomatik workflow boshlanadi (route shabloniga ko'ra)
 *   3. Har bosqichda current_approver belgilanadi
 *   4. Approver Telegram bot orqali tasdiqlash so'rovi oladi
 *   5. Tasdiqlasa → keyingi bosqich
 *   6. Rad etsa → izoh majburiy + initiator'ga qaytadi
 *   7. Hammasi tasdiqlansa → status=archived
 *
 * Approve/reject decisions: see document-workflow-v2-decisions.service.ts (Rule 16).
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { DocumentWorkflowV2DecisionsService } from './document-workflow-v2-decisions.service';

interface InitiateDocumentDto {
  employeeId: number;
  documentType: string;
  title: string;
  description?: string;
  fileUrl?: string;
  initiatorId: number;
}

@Injectable()
export class DocumentWorkflowV2Service {
  private readonly logger = new Logger(DocumentWorkflowV2Service.name);
  private readonly decisions: DocumentWorkflowV2DecisionsService;

  constructor(private readonly i18n: I18nService) {
    this.decisions = new DocumentWorkflowV2DecisionsService(i18n);
  }

  /** Hujjat workflow ro'yxati — qaysi turdagi hujjat qanday yo'l yuradi */
  async listRoutes(): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT
          id,
          document_type AS "documentType",
          name, name_ru AS "nameRu",
          vertical_steps AS "verticalSteps",
          horizontal_steps AS "horizontalSteps",
          approval_timeout_hours AS "approvalTimeoutHours",
          is_active AS "isActive"
        FROM document_workflow_routes
        WHERE is_active = true
        ORDER BY name
      `);
      return dbRows(rows);
    });
  }

  /**
   * Yangi hujjat workflow boshlash.
   * 1. hr_v2_documents'ga yozish
   * 2. document_workflow_instances'ga yozish (current_step=0, current_approver belgilanadi)
   */
  async initiateDocument(dto: InitiateDocumentDto): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      await this.ensureRouteExists(dto.documentType);
      const docId = await this.insertDocument(dto);
      const instId = await this.insertWorkflowInstance(docId, dto);
      this.logger.log(`Document #${docId} workflow #${instId} initiated by user ${dto.initiatorId}`);
      return {
        documentId: docId,
        instanceId: instId,
        documentType: dto.documentType,
        currentStepIndex: 0,
        status: 'pending',
      };
    });
  }

  private async ensureRouteExists(documentType: string): Promise<void> {
    const routeRows = await rawSql(sql`
      SELECT id, vertical_steps, horizontal_steps
      FROM document_workflow_routes
      WHERE document_type = ${documentType} AND is_active = true
      LIMIT 1
    `);
    if (!dbRows(routeRows)[0]) {
      throw new BadRequestException(
        await this.i18n.t('errors.workflowTemplateNotFoundForDocumentType', { args: { documentType } }),
      );
    }
  }

  private async insertDocument(dto: InitiateDocumentDto): Promise<number> {
    const docRows = await rawSql(sql`
      INSERT INTO hr_v2_documents (
        employee_id, document_type, title, description, status, current_step, file_url, created_by, created_at
      ) VALUES (
        ${dto.employeeId}, ${dto.documentType}, ${dto.title}, ${dto.description ?? null},
        'pending', 1, ${dto.fileUrl ?? null}, ${dto.initiatorId}, NOW()
      )
      RETURNING id
    `);
    const doc = dbRows(docRows)[0];
    // WHY: caller wraps this in safeCall which maps BadRequestException → BAD_REQUEST.
    if (!doc) throw new BadRequestException(await this.i18n.t('errors.documentCreationFailed'));
    return Number(doc['id']);
  }

  private async insertWorkflowInstance(docId: number, dto: InitiateDocumentDto): Promise<number> {
    const instRows = await rawSql(sql`
      INSERT INTO document_workflow_instances (
        document_id, document_type, initiator_id, current_step_index, status, started_at
      ) VALUES (
        ${docId}, ${dto.documentType}, ${dto.initiatorId}, 0, 'pending', NOW()
      )
      RETURNING id
    `);
    const inst = dbRows(instRows)[0];
    return Number(inst?.['id'] ?? 0);
  }

  /** Tasdiqlash — delegated. */
  approveStep(instanceId: number, approverId: number, comment?: string) {
    return this.decisions.approveStep(instanceId, approverId, comment);
  }

  /** Rad etish — delegated. */
  rejectStep(instanceId: number, rejectedById: number, reason: string) {
    return this.decisions.rejectStep(instanceId, rejectedById, reason);
  }

  /** Xodim'ning faol hujjatlari (pending status'da). */
  async getEmployeeDocuments(employeeId: number): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT
          d.id, d.document_type AS "documentType", d.title, d.status,
          d.current_step AS "currentStep", d.created_at AS "createdAt",
          i.id AS "instanceId", i.current_step_index AS "currentStepIndex",
          i.rejection_reason AS "rejectionReason"
        FROM hr_v2_documents d
        LEFT JOIN document_workflow_instances i ON i.document_id = d.id
        WHERE d.employee_id = ${employeeId}
        ORDER BY d.created_at DESC
        LIMIT 50
      `);
      return dbRows(rows);
    });
  }

  /** Approver'ning kutib turgan hujjatlari. */
  async getPendingApprovals(_approverId: number): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      // NOTE: approver-role filtering against org-structure is deferred to a
      // future iteration. Current behavior returns ALL pending instances so
      // admin dashboards work; non-admin callers are gated upstream by RBAC.
      // Tracking: deferred to sprint when org-structure FK is migrated.
      const rows = await rawSql(sql`
        SELECT
          i.id, i.document_id AS "documentId", i.document_type AS "documentType",
          i.current_step_index AS "currentStepIndex", i.started_at AS "startedAt",
          d.title, d.description, d.employee_id AS "employeeId",
          e.first_name || ' ' || e.last_name AS "employeeName",
          r.vertical_steps AS "verticalSteps"
        FROM document_workflow_instances i
        JOIN hr_v2_documents d ON d.id = i.document_id
        LEFT JOIN employees e ON e.id = d.employee_id
        LEFT JOIN document_workflow_routes r ON r.document_type = i.document_type
        WHERE i.status = 'pending'
        ORDER BY i.started_at ASC
        LIMIT 100
      `);
      return dbRows(rows);
    });
  }
}
