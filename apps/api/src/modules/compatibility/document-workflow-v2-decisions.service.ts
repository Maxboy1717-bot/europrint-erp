/**
 * @module document-workflow-v2-decisions.service
 * @description Approve/reject step handlers extracted from document-workflow-v2.service.ts
 *   to keep that file <300 lines (Rule 16).
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class DocumentWorkflowV2DecisionsService {
  private readonly logger = new Logger(DocumentWorkflowV2DecisionsService.name);

  /** Tasdiqlash — keyingi bosqichga o'tish. */
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

  /** Rad etish — izoh MAJBURIY (Q82). */
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
}
