/**
 * @module i-crm-leads.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface ICrmLeadsRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  softDelete(id: number): Promise<Result<void>>;
  logEmail(leadId: number, subject: string, body: string, managerId: number | null): Promise<Result<Row>>;
}
export const CRM_LEADS_REPO = 'ICrmLeadsRepository';
