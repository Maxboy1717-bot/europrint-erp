/**
 * @module i-crm-custom-fields.repo
 * @description Domain repository interface for CRM custom fields metadata.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/crm-custom-fields.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_CUSTOM_FIELDS_REPO = Symbol('CRM_CUSTOM_FIELDS_REPO');

export interface ICrmCustomFieldsRepo {
  list(entityType: string | null): Promise<Result<Row[]>>;
  create(body: Row): Promise<Result<Row | null>>;
  update(id: number, body: Row): Promise<Result<Row | null>>;
  reorder(items: Array<{ id: number; order_index: number }>): Promise<void>;
  remove(id: number): Promise<void>;
}
