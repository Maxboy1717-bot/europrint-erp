/**
 * @module i-crm-contacts-app.repo
 * @description Domain repository interface for the legacy CRM contacts repo
 *   (application-layer pseudo-repo migrated to infrastructure).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/crm-contacts.repository.ts`.
 *
 *   NOTE: distinct from the DDD-style `contacts/i-crm-contacts.repo.ts` —
 *   this interface preserves the legacy row-shaped signatures used by the
 *   application service.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_CONTACTS_APP_REPO = Symbol('CRM_CONTACTS_APP_REPO');

export interface ICrmContactsAppRepo {
  listContacts(search: string | undefined, companyId: number | null, lim: number, off: number): Promise<Result<Row[]>>;
  findById(cid: number): Promise<Result<Row | null>>;
  checkDuplicates(email?: string, phone?: string): Promise<Result<Row[]>>;
  create(first_name: unknown, last_name: unknown, email: unknown, phone: unknown, company_id: unknown, position: unknown, notes: unknown): Promise<Result<Row>>;
  update(cid: number, first_name: unknown, last_name: unknown, email: unknown, phone: unknown, company_id: unknown, position: unknown, notes: unknown): Promise<Result<Row | null>>;
  remove(cid: number): Promise<void>;
}
