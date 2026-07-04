/**
 * @module i-crm-auto-lead.repo
 * @description Domain repository interface for CRM auto-lead ingestion.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/crm-auto-lead.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_AUTO_LEAD_REPO = Symbol('CRM_AUTO_LEAD_REPO');

export interface ICrmAutoLeadRepo {
  findLeadScore(eid: number): Promise<Result<Row | null>>;
  findDeal(eid: number): Promise<Result<Row | null>>;
  getSupervisorDashboard(): Promise<Result<Row[]>>;
  getAutoLeadSources(): Promise<Result<Row[]>>;
  ingestCallLead(phone: unknown, first_name: unknown, last_name: unknown, notes: unknown, source_meta: unknown): Promise<Result<Row>>;
  ingestFormLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, form_name: unknown, notes: unknown): Promise<Result<Row>>;
  ingestTelegramLead(first_name: unknown, last_name: unknown, username: unknown, message: unknown): Promise<Result<Row>>;
  ingestWebsiteLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, page_url: unknown, message: unknown): Promise<Result<Row>>;
  ingestWhatsappLead(phone: unknown, first_name: unknown, last_name: unknown, message: unknown): Promise<Result<Row>>;
  ingestSmsLead(phone: unknown, first_name: unknown, last_name: unknown, message: unknown): Promise<Result<Row>>;
  getChurnRisk(entityType: string, eid: number): Promise<Result<Row | null>>;
}
