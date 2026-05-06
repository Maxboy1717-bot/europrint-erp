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
 * Jadvallar:
 *   - hr_v2_documents          (asosiy hujjat)
 *   - document_workflow_routes (shablonlar: leave_request, advance, ...)
 *   - document_workflow_instances (har hujjat ishi xolati)
 *   - document_signatures      (fizik imzo tasdiqlash)
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

interface InitiateDocumentDto {
  employeeId: number;
  documentType: string;
  title: string;
  description?: string;
  fileUrl?: string;
  initiatorId: number;
}

interface WorkflowRoute {
  id: number;
  documentType: string;
  name: string;
  verticalSteps: string[];
  horizontalSteps: string[];
  approvalTimeoutHours: number;
}

@Injectable()
export class DocumentWorkflowV2Service {
  private readonly logger = new Logger(DocumentWorkflowV2Service.name);

  /**
   * Hujjat workflow ro'yxati — qaysi turdagi hujjat qanday yo'l yuradi
   */
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
      // 1. Route shabloni topish
      const routeRows = await rawSql(sql`
        SELECT id, vertical_steps, horizontal_steps
        FROM document_workflow_routes
        WHERE document_type = ${dto.documentType} AND is_active = true
        LIMIT 1
      `);
      const route = dbRows(routeRows)[0];
      if (!route) {
        throw new BadRequestException(
          `Hujjat turi "${dto.documentType}" uchun workflow shabloni topilmadi`,
        );
      }

      // 2. hr_v2_documents'ga insert
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
      if (!doc) throw new Error('Hujjat yaratish bajarilmadi');
      const docId = Number(doc['id']);

      // 3. Workflow instance yaratish
      const instRows = await rawSql(sql`
        INSERT INTO document_workflow_instances (
          document_id, document_type, initiator_id, current_step_index, status, started_at
        ) VALUES (
          ${docId}, ${dto.documentType}, ${dto.initiatorId}, 0, 'pending', NOW()
        )
        RETURNING id
      `);
      const inst = dbRows(instRows)[0];
      const instId = Number(inst?.['id'] ?? 0);

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

  /**
   * Tasdiqlash — keyingi bosqichga o'tish.
   */
  async approveStep(
    instanceId: number,
    approverId: number,
    comment?: string,
  ): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const instRows = await rawSql(sql`
        SELECT i.id, i.document_id, i.document_type, i.current_step_index, i.status,
               i.steps_history, r.vertical_steps
        FROM document_workflow_instances i
        LEFT JOIN document_workflow_routes r ON r.document_type = i.document_type
        WHERE i.id = ${instanceId} AND i.status = 'pending'
      `);
      const inst = dbRows(instRows)[0];
      if (!inst) throw new NotFoundException(`Workflow instance #${instanceId} topilmadi yoki yopilgan`);

      const verticalSteps = Array.isArray(inst['vertical_steps']) ? inst['vertical_steps'] : [];
      const currentIndex = Number(inst['current_step_index'] ?? 0);
      const isLastStep = currentIndex >= verticalSteps.length - 1;

      // History'ga qo'shish
      const oldHistory = Array.isArray(inst['steps_history']) ? inst['steps_history'] : [];
      const newHistory = [
        ...oldHistory,
        {
          step: currentIndex,
          stepName: verticalSteps[currentIndex] ?? 'unknown',
          action: 'approved',
          approverId,
          comment: comment ?? null,
          at: new Date().toISOString(),
        },
      ];

      if (isLastStep) {
        // Hammasi tasdiqlandi → arxivlash
        await rawSql(sql`
          UPDATE document_workflow_instances
          SET status = 'approved',
              steps_history = ${JSON.stringify(newHistory)}::jsonb,
              completed_at = NOW(),
              updated_at = NOW()
          WHERE id = ${instanceId}
        `);
        await rawSql(sql`
          UPDATE hr_v2_documents
          SET status = 'approved', current_step = ${currentIndex + 1}, updated_at = NOW()
          WHERE id = ${inst['document_id']}
        `);
        this.logger.log(`Document #${inst['document_id']} fully approved by user ${approverId}`);
        return { documentId: inst['document_id'], status: 'approved', stepsCompleted: currentIndex + 1 };
      } else {
        // Keyingi bosqichga o'tish
        await rawSql(sql`
          UPDATE document_workflow_instances
          SET current_step_index = ${currentIndex + 1},
              steps_history = ${JSON.stringify(newHistory)}::jsonb,
              updated_at = NOW()
          WHERE id = ${instanceId}
        `);
        await rawSql(sql`
          UPDATE hr_v2_documents
          SET current_step = ${currentIndex + 2}, updated_at = NOW()
          WHERE id = ${inst['document_id']}
        `);
        this.logger.log(`Document #${inst['document_id']} step ${currentIndex} → ${currentIndex + 1}`);
        return {
          documentId: inst['document_id'],
          status: 'pending',
          currentStepIndex: currentIndex + 1,
          nextApproverRole: verticalSteps[currentIndex + 1],
        };
      }
    });
  }

  /**
   * Rad etish — izoh MAJBURIY (Q82).
   */
  async rejectStep(
    instanceId: number,
    rejectedById: number,
    reason: string,
  ): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      if (!reason || reason.trim().length < 10) {
        throw new BadRequestException(
          'Rad etish sababini kamida 10 belgi yozing (kim uchun ekanligini tushuntirib bering)',
        );
      }

      const instRows = await rawSql(sql`
        SELECT id, document_id, current_step_index, steps_history
        FROM document_workflow_instances
        WHERE id = ${instanceId} AND status = 'pending'
      `);
      const inst = dbRows(instRows)[0];
      if (!inst) throw new NotFoundException(`Workflow #${instanceId} topilmadi`);

      const oldHistory = Array.isArray(inst['steps_history']) ? inst['steps_history'] : [];
      const newHistory = [
        ...oldHistory,
        {
          step: inst['current_step_index'],
          action: 'rejected',
          rejectedById,
          reason,
          at: new Date().toISOString(),
        },
      ];

      await rawSql(sql`
        UPDATE document_workflow_instances
        SET status = 'rejected',
            rejection_reason = ${reason},
            steps_history = ${JSON.stringify(newHistory)}::jsonb,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = ${instanceId}
      `);
      await rawSql(sql`
        UPDATE hr_v2_documents
        SET status = 'rejected', updated_at = NOW()
        WHERE id = ${inst['document_id']}
      `);

      this.logger.log(`Document #${inst['document_id']} rejected by user ${rejectedById}: ${reason}`);
      return { documentId: inst['document_id'], status: 'rejected', reason };
    });
  }

  /**
   * Xodim'ning faol hujjatlari (pending status'da).
   */
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

  /**
   * Approver'ning kutib turgan hujjatlari.
   */
  async getPendingApprovals(_approverId: number): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      // TODO: org-structure'dan approver role'ni aniqlash
      // Hozircha barcha pending instances qaytaradi (admin uchun)
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
