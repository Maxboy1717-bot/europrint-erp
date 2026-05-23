/**
 * @module document-workflow.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import {
  hr_documents, document_approval_steps, workflow_route_configs,
  employee_blocks, hrEmployees,
} from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class DocumentWorkflowRepository {
  async insertDocument(dto: { employeeId: number; documentType: string; title: string; content?: Row; pdfUrl?: string; initiatedBy: number }): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.insert(hr_documents).values({
        employeeId:   dto.employeeId,
        documentType: dto.documentType,
        title:        dto.title,
        content:      dto.content ? dto.content : null,
        pdfUrl:       dto.pdfUrl ?? null,
        status:       'pending',
        initiatedBy:  dto.initiatedBy,
      }).returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async submitDocument(documentId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(hr_documents).set({
        status:    'submitted',
        updatedAt: _time.now(),
      })
        .where(sql`${hr_documents.id} = ${documentId} AND ${hr_documents.status} = 'pending'`)
        .returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async findRouteConfig(documentType: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(workflow_route_configs)
        .where(sql`${workflow_route_configs.document_type} = ${documentType} AND ${workflow_route_configs.is_active} = true`)
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async insertDefaultApprovalStep(documentId: number): Promise<void> {
    await db.insert(document_approval_steps).values({
      documentId: documentId,
      stepNumber: 1,
      status:     'pending',
    });
    await db.update(hr_documents).set({ totalSteps: 1 }).where(eq(hr_documents.id, documentId));
  }

  async insertApprovalStep(documentId: number, stepNumber: number, _approverRole: string, approverId: unknown): Promise<void> {
    await db.insert(document_approval_steps).values({
      documentId: documentId,
      stepNumber: stepNumber,
      approverId: approverId != null ? Number(approverId) : null,
      status:     'pending',
    });
  }

  async updateDocumentTotalSteps(documentId: number, totalSteps: number): Promise<void> {
    await db.update(hr_documents).set({ totalSteps: totalSteps }).where(eq(hr_documents.id, documentId));
  }

  async approveStep(stepId: number, approverId: number, comment?: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(document_approval_steps).set({
        status:     'approved',
        actionAt:   _time.now(),
        approverId: approverId,
        comment:    comment ?? null,
      }).where(eq(document_approval_steps.id, stepId)).returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async findNextStep(documentId: unknown, stepNumber: unknown): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(document_approval_steps)
        .where(sql`${document_approval_steps.documentId} = ${documentId} AND ${document_approval_steps.stepNumber} > ${stepNumber}`)
        .orderBy(document_approval_steps.stepNumber)
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async fullyApproveDocument(documentId: unknown): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(hr_documents).set({
        status:    'approved',
        updatedAt: _time.now(),
      })
        .where(eq(hr_documents.id, Number(documentId)))
        .returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async advanceDocumentStep(documentId: unknown, stepNumber: unknown): Promise<void> {
    await db.update(hr_documents).set({
      currentStep: Number(stepNumber),
      updatedAt:   _time.now(),
    }).where(eq(hr_documents.id, Number(documentId)));
  }

  async rejectStep(stepId: number, rejectedById: number, reason: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(document_approval_steps).set({
        status:     'rejected',
        actionAt:   _time.now(),
        approverId: rejectedById,
        comment:    reason,
      }).where(eq(document_approval_steps.id, stepId)).returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async rejectDocument(documentId: unknown): Promise<void> {
    await db.update(hr_documents).set({ status: 'rejected', updatedAt: _time.now() }).where(eq(hr_documents.id, Number(documentId)));
  }

  async unblockEmployee(employeeId: number, unblockedBy: number): Promise<void> {
    await db.update(employee_blocks).set({
      isActive:    false,
      unblockedBy: unblockedBy,
      unblockedAt: _time.now(),
    }).where(sql`${employee_blocks.employeeId} = ${employeeId} AND ${employee_blocks.isActive} = true`);
    await db.update(hrEmployees).set({ is_blocked: false, blocked_reason: null }).where(eq(hrEmployees.id, employeeId));
  }

  async getDocumentsByEmployee(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT d.*,
               json_agg(json_build_object(
                 'id', das.id,
                 'step_number', das.step_number,
                 'approver_id', das.approver_id,
                 'status', das.status,
                 'approved_at', das.approved_at,
                 'notes', das.notes
               ) ORDER BY das.step_number) FILTER (WHERE das.id IS NOT NULL) AS approval_steps
        FROM hr_documents d
        LEFT JOIN document_approval_steps das ON das.document_id = d.id
        WHERE d.employee_id = ${employeeId}
        GROUP BY d.id
        ORDER BY d.created_at DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async listDocuments(limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:            hr_documents.id,
        documentType:  hr_documents.documentType,
        title:         hr_documents.title,
        status:        hr_documents.status,
        createdAt:     hr_documents.createdAt,
        employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
      })
        .from(hr_documents)
        .leftJoin(hrEmployees, eq(hrEmployees.id, hr_documents.employeeId))
        .orderBy(sql`${hr_documents.createdAt} DESC`)
        .limit(limit);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async findDocument(documentId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(hr_documents).where(eq(hr_documents.id, documentId)).limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async findPendingStep(documentId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(document_approval_steps)
        .where(sql`${document_approval_steps.documentId} = ${documentId} AND ${document_approval_steps.status} = 'pending'`)
        .orderBy(document_approval_steps.stepNumber)
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async finalizeDocument(documentId: number): Promise<void> {
    await db.update(hr_documents).set({ status: 'approved', updatedAt: _time.now() }).where(eq(hr_documents.id, documentId));
  }

  async findOverdueDocuments(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:         hr_documents.id,
        employeeId: hr_documents.employeeId,
        title:      hr_documents.title,
        createdAt:  hr_documents.createdAt,
      })
        .from(hr_documents)
        .where(sql`${hr_documents.status} IN ('pending', 'submitted') AND ${hr_documents.createdAt} < NOW() - INTERVAL '48 hours'`);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }
}
