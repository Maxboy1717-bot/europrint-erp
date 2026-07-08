/**
 * @module i-stat-regulation.repo
 * @description Domain repository interface for director statistic-regulation
 *   master-data (versioned: every edit is a new row, old row is_active=false).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/stat-regulation.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

export interface IStatRegRow {
  id: number;
  name_uz: string;
  name_ru?: string | null;
  definition?: string | null;
  formula?: string | null;
  unit?: string | null;
  frequency: string;
  source_module?: string | null;
  owner_card_id?: number | null;
  target_value?: string | null;
  version: number;
  valid_from: string;
  is_active: boolean;
  approved_by_card_id?: number | null;
  approved_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type StatRegCreateInput = {
  name_uz: string;
  name_ru?: string | null;
  definition?: string | null;
  formula?: string | null;
  unit?: string | null;
  frequency: string;
  source_module?: string | null;
  owner_card_id?: number | null;
  target_value?: string | null;
};

export type StatRegUpdateInput = Partial<StatRegCreateInput>;

export interface IStatRegulationRepo {
  list(activeOnly: boolean): Promise<Result<IStatRegRow[]>>;
  getById(id: number): Promise<Result<IStatRegRow | null>>;
  getHistory(nameUz: string): Promise<Result<IStatRegRow[]>>;
  create(dto: StatRegCreateInput): Promise<Result<IStatRegRow>>;
  /** Versiyalash: eski qator is_active=false, yangi versiya INSERT. */
  update(id: number, dto: StatRegUpdateInput): Promise<Result<IStatRegRow>>;
  deactivate(id: number): Promise<Result<void>>;
  /** Sign-off: joriy (faol) versiyani tasdiqlagan KARTA + vaqtini yozadi. */
  approve(id: number, approverCardId: number): Promise<Result<IStatRegRow>>;
}

export const STAT_REGULATION_REPO = Symbol('STAT_REGULATION_REPO');
