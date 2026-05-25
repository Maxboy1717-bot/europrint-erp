/**
 * @module i-crm-companies.repo
 * @description Domain repository interface for CRM companies / lead stages.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/crm-companies.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_COMPANIES_REPO = Symbol('CRM_COMPANIES_REPO');

export interface ICrmCompaniesRepo {
  listCompanies(pat: string | null, lim: number, off: number): Promise<Result<Row[]>>;
  getCompany(cid: number): Promise<Result<Row | null>>;
  getCompanyContacts(cid: number): Promise<Result<Row[]>>;
  getCompanyDeals(cid: number): Promise<Result<Row[]>>;
  getCompanyCredit(cid: number): Promise<Result<Row | null>>;
  checkDuplicates(name?: string, inn?: string): Promise<Result<unknown[]>>;
  createCompany(body: Row): Promise<Result<Row>>;
  updateCompany(cid: number, body: Row): Promise<Result<Row | null>>;
  updateCreditLimit(cid: number, credit_limit: number): Promise<Result<Row | null>>;
  listLeadStages(): Promise<Result<Row[]>>;
  getLeadStage(sid: number): Promise<Result<Row | null>>;
  createLeadStage(name: string, color?: string, sort_order?: number): Promise<Result<Row>>;
  updateLeadStage(sid: number, body: Row): Promise<Result<Row | null>>;
  deleteCompany(cid: number): Promise<void>;
  createCompanyContact(companyId: number, body: Row): Promise<Result<Row>>;
  deleteCompanyContact(companyId: number, contactId: number): Promise<void>;
}
