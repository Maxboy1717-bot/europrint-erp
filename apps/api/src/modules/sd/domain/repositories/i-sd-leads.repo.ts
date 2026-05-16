/**
 * @module i-sd-leads.repo
 * @description Domain repository interface for SD leads / lead activities /
 *   atomic lead-to-order conversion. Concrete implementation lives at
 *   `infrastructure/repositories/sd-leads.repository.ts`.
 * @layer Domain (SD)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ISdLeadsRepo {
  list(status: string | undefined, uid: number | null, pat: string | null, lim: number, off: number): Promise<Result<Row[]>>;
  getStats(): Promise<Result<Row>>;
  exportLeads(from?: string, to?: string, status?: string): Promise<Result<Row[]>>;
  getById(lid: number): Promise<Result<Row[]>>;
  create(body: Row): Promise<Result<Row>>;
  update(lid: number, body: Row): Promise<Result<Row[]>>;
  updateStatus(lid: number, status: string): Promise<Result<Row[]>>;
  delete(lid: number): Promise<Result<void>>;
  getLeadForConvert(lid: number): Promise<Result<Row | null>>;
  insertOrderFromLead(customer_id: unknown, expected_amount: unknown, lid: number, notes: unknown): Promise<Result<Row>>;
  markConverted(lid: number): Promise<Result<void>>;
  convertLeadToOrderAtomic(customer_id: unknown, expected_amount: unknown, lid: number, notes: unknown): Promise<Result<Row>>;
  addActivity(lid: number, type: unknown, subject: unknown, notes: unknown, employee_id: unknown): Promise<Result<Row>>;
  getActivities(lid: number): Promise<Result<Row[]>>;
}

export const SD_LEADS_REPO = Symbol('SD_LEADS_REPO');
