/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   multi-statement atomic transition + audit + history insertion patterns.
 *   See ARCHITECTURE_RULES.md Rule 4.
 *
 * Communication Center — Hujjat repository facade. Implementation split into
 *   ./cc-documents/cc-documents-read.repo.ts and ./cc-documents-write.repo.ts
 *   to satisfy Rule 16. External consumers continue using CcDocumentsRepository.
 */

import { Injectable } from '@nestjs/common';
import { CcDocumentsReadRepo } from './cc-documents/cc-documents-read.repo';
import { CcDocumentsWriteRepo } from './cc-documents/cc-documents-write.repo';

export type {
  DocumentRow, TemplateRow, WorkflowStepRow, CreateDraftInput,
  CcTemplateAdminRow, CreateTemplateInput, UpdateTemplateInput,
} from './cc-documents/types';
export { CcDocumentsReadRepo, CcDocumentsWriteRepo };

@Injectable()
export class CcDocumentsRepository {
  constructor(
    private readonly reader: CcDocumentsReadRepo,
    private readonly writer: CcDocumentsWriteRepo,
  ) {}

  // ─── Read ────────────────────────────────────────────────────────────────
  getTemplate = (id: string) => this.reader.getTemplate(id);
  getTemplateAdmin = (id: string) => this.reader.getTemplateAdmin(id);
  getStepsForTemplate = (id: string, v: number) => this.reader.getStepsForTemplate(id, v);
  getById = (id: string) => this.reader.getById(id);
  getPendingApprovalsAtStep = (id: string, step: number) => this.reader.getPendingApprovalsAtStep(id, step);

  // ─── Write ───────────────────────────────────────────────────────────────
  createDraft = (input: Parameters<CcDocumentsWriteRepo['createDraft']>[0]) => this.writer.createDraft(input);
  createTemplate = (input: Parameters<CcDocumentsWriteRepo['createTemplate']>[0]) => this.writer.createTemplate(input);
  updateTemplate = (id: string, patch: Parameters<CcDocumentsWriteRepo['updateTemplate']>[1]) => this.writer.updateTemplate(id, patch);
  deleteTemplate = (id: string) => this.writer.deleteTemplate(id);
  transition = (args: Parameters<CcDocumentsWriteRepo['transition']>[0]) => this.writer.transition(args);
  createApproval = (args: Parameters<CcDocumentsWriteRepo['createApproval']>[0]) => this.writer.createApproval(args);
  signApproval = (args: Parameters<CcDocumentsWriteRepo['signApproval']>[0]) => this.writer.signApproval(args);
  cancel = (args: Parameters<CcDocumentsWriteRepo['cancel']>[0]) => this.writer.cancel(args);
  snapshotVersion = (args: Parameters<CcDocumentsWriteRepo['snapshotVersion']>[0]) => this.writer.snapshotVersion(args);
  updateBody = (args: Parameters<CcDocumentsWriteRepo['updateBody']>[0]) => this.writer.updateBody(args);
  createComplaint = (args: Parameters<CcDocumentsWriteRepo['createComplaint']>[0]) => this.writer.createComplaint(args);
  logPrint = (args: Parameters<CcDocumentsWriteRepo['logPrint']>[0]) => this.writer.logPrint(args);
  logAudit = (args: Parameters<CcDocumentsWriteRepo['logAudit']>[0]) => this.writer.logAudit(args);
  markViewed = (documentId: string, via: string) => this.writer.markViewed(documentId, via);
  notifyUser = (args: Parameters<CcDocumentsWriteRepo['notifyUser']>[0]) => this.writer.notifyUser(args);
}
