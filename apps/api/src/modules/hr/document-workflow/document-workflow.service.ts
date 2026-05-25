/**
 * @module document-workflow.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { DocumentWorkflowRepository } from './document-workflow.repository';
import { DocumentSubmittedEvent } from '../domain/events/document-submitted.event';
import { DocumentApprovedEvent } from '../domain/events/document-approved.event';
import { DocumentRejectedEvent } from '../domain/events/document-rejected.event';

@Injectable()
export class DocumentWorkflowService {
  private readonly logger = new Logger(DocumentWorkflowService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly eventBus: EventBus,
    private readonly repo: DocumentWorkflowRepository,
  ) {}

  async createDocument(dto: {
    employeeId: number;
    documentType: string;
    title: string;
    content?: Record<string, unknown>;
    pdfUrl?: string;
    initiatedBy: number;
  }) {
    return safeCall(async () => {
      const doc = await this.repo.insertDocument(dto);
      if (doc.ok && doc.data) {
        await this.createDefaultApprovalSteps((doc.data as Record<string, unknown>)['id'] as number, dto.documentType);
      }
      return doc.ok ? doc.data : null;
    });
  }

  async submitDocument(documentId: number, submittedBy: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const doc = await this.repo.submitDocument(documentId);
      if (!doc.ok || !doc.data) throw new NotFoundException(`Document #${documentId} not found or already submitted`);
      const docData = doc.data as Record<string, unknown>;
      const submittedPayload = {
        documentId,
        employeeId: Number(docData['employee_id']),
        documentType: String(docData['document_type']),
        title: String(docData['title']),
      };
      // PA2-18 Wave 4 round-3: dual emit — CQRS bus for canonical
      // @EventsHandler consumers, plus the legacy string topic for non-migrated
      // listeners (telegram-bots.service, etc.).
      this.eventBus.publish(new DocumentSubmittedEvent(submittedPayload));
      this.eventEmitter.emit(HrV2Events.DOCUMENT_SUBMITTED, submittedPayload);
      return docData;
    });
  }

  private async createDefaultApprovalSteps(documentId: number, documentType: string) {
    const route = await this.repo.findRouteConfig(documentType);

    if (!route.ok || !route.data) {
      await this.repo.insertDefaultApprovalStep(documentId);
      return;
    }
    const routeData = route.data as Record<string, unknown>;

    if (!routeData['steps']) {
      await this.repo.insertDefaultApprovalStep(documentId);
      return;
    }

    let steps: Record<string, unknown>[];
    if (Array.isArray(routeData['steps'])) {
      steps = routeData['steps'] as Record<string, unknown>[];
    } else {
      try {
        steps = JSON.parse(String(routeData['steps'] ?? '[]')) as Record<string, unknown>[];
      } catch {
        this.logger.warn(`Document workflow steps JSON parse failed for documentId=${documentId}`);
        steps = [];
      }
    }
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i] as Record<string, unknown>;
      await this.repo.insertApprovalStep(documentId, i + 1, String(step['approver_role'] || ''), step['approver_id'] != null ? step['approver_id'] : null);
    }
    await this.repo.updateDocumentTotalSteps(documentId, steps.length);
  }

  async approveStep(stepId: number, approverId: number, comment?: string) {
    return safeCall(async () => {
      const step = await this.repo.approveStep(stepId, approverId, comment);
      if (!step.ok || !step.data) throw new NotFoundException(`Step #${stepId} not found`);
      const stepData = step.data as Record<string, unknown>;

      const nextStep = await this.repo.findNextStep(stepData['document_id'] as number, stepData['step_number'] as number);

      if (!nextStep.ok || !nextStep.data) {
        const approvedDoc = await this.repo.fullyApproveDocument(stepData['document_id'] as number);
        const approvedDocData = (approvedDoc.ok && approvedDoc.data) ? approvedDoc.data as Record<string, unknown> : null;
        const employeeId = approvedDocData?.['employee_id'];
        const documentType = approvedDocData?.['document_type'] as string | undefined;
        const approvedPayload = {
          documentId: stepData['document_id'] as number,
          employeeId: employeeId != null ? Number(employeeId) : undefined,
          documentType,
        };
        // PA2-18 Wave 4 round-3: dual emit — CQRS bus for canonical
        // @EventsHandler consumers, plus the legacy string topic for
        // non-migrated listeners (gamification.service, telegram-bots.service).
        this.eventBus.publish(new DocumentApprovedEvent(approvedPayload));
        this.eventEmitter.emit(HrV2Events.DOCUMENT_APPROVED, approvedPayload);
        if (documentType === 'dalolatnoma' && employeeId) {
          await this.unblockAfterDalolatnoma(employeeId as number, approverId, stepData['document_id'] as number);
        }
      } else {
        const nextStepData = nextStep.data as Record<string, unknown>;
        await this.repo.advanceDocumentStep(stepData['document_id'] as number, nextStepData['step_number'] as number);
      }

      return stepData;
    });
  }

  async rejectStep(stepId: number, rejectedById: number, reason: string) {
    return safeCall(async () => {
      const step = await this.repo.rejectStep(stepId, rejectedById, reason);
      if (!step.ok || !step.data) throw new NotFoundException(`Step #${stepId} not found`);
      const stepData = step.data as Record<string, unknown>;
      const docId = stepData['document_id'] as number;
      await this.repo.rejectDocument(docId);

      const docRes = await this.repo.findDocument(docId);
      const doc    = docRes.ok && docRes.data
        ? (docRes.data as Record<string, unknown>)
        : null;

      const rejectedPayload = {
        documentId:     docId,
        rejectionReason: reason,
        documentType:   doc?.['document_type'] as string | undefined,
        employeeId:     doc?.['employee_id']   as number | undefined,
        content:        doc?.['content']       as Record<string, unknown> | undefined,
      };
      // PA2-18 Wave 4 round-3: dual emit — CQRS bus for canonical
      // @EventsHandler consumers, plus the legacy string topic for
      // non-migrated listeners (telegram-bots.service, etc.).
      this.eventBus.publish(new DocumentRejectedEvent(rejectedPayload));
      this.eventEmitter.emit(HrV2Events.DOCUMENT_REJECTED, rejectedPayload);
      return stepData;
    });
  }

  private async unblockAfterDalolatnoma(employeeId: number, unblockedBy: number, documentId: number) {
    const reason = `Dalolatnoma tasdiqlandi (hujjat #${documentId}): blok olib tashlandi`;
    await this.repo.unblockEmployee(employeeId, unblockedBy);
    this.eventEmitter.emit(HrV2Events.EMPLOYEE_UNBLOCKED, {
      employeeId,
      unblockedBy,
      reason,
      documentId,
    });
    this.logger.log(`Dalolatnoma #${documentId} tasdiqlandi — xodim #${employeeId} blokdan chiqarildi`);
  }

  async getDocumentById(documentId: number) {
    return this.repo.findDocument(documentId);
  }

  async getDocumentsByEmployee(employeeId: number) {
    return safeCall(async () => this.repo.getDocumentsByEmployee(employeeId));
  }

  async listDocuments(limit = 50) {
    return safeCall(async () => this.repo.listDocuments(limit));
  }

  async processDocument(documentId: number) {
    return safeCall(async () => {
      const doc = await this.repo.findDocument(documentId);
      if (!doc.ok || !doc.data) throw new NotFoundException(`Hujjat #${documentId} topilmadi`);
      const docData = doc.data as Record<string, unknown>;
      if (docData['status'] === 'approved') {
        this.logger.log(`Document #${documentId} already approved`);
        return docData;
      }
      const nextStep = await this.repo.findPendingStep(documentId);
      if (!nextStep.ok || !nextStep.data) {
        await this.repo.finalizeDocument(documentId);
        // PA2-18 Wave 4 round-3: dual emit — CQRS bus for canonical
        // @EventsHandler consumers, plus the legacy string topic.
        this.eventBus.publish(new DocumentApprovedEvent({ documentId }));
        this.eventEmitter.emit(HrV2Events.DOCUMENT_APPROVED, { documentId });
      }
      return docData;
    });
  }

  @Cron('0 * * * *')
  async checkOverdueDocuments() {
    return safeCall(async () => {
      const docs = await this.repo.findOverdueDocuments();
      const docsData = (docs.ok ? docs.data : []) as Record<string, unknown>[];
      for (const doc of docsData) {
        this.eventEmitter.emit(HrV2Events.DOCUMENT_OVERDUE, {
          documentId: doc['id'],
          employeeId: doc['employee_id'],
          title: doc['title'],
        });
      }
      if (docsData.length > 0) {
        this.logger.warn(`${docsData.length} overdue documents found`);
      }
    });
  }
}
