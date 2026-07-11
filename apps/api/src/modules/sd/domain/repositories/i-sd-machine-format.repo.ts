/**
 * @module i-sd-machine-format.repo
 * @description Repository port for the SD machine-format catalog (72 / 52SM / KVA) — vision 06-sd #102.
 *   Catalog rows carry per-format sheet size + price (owner master-data, filled via CRUD; seeded with
 *   NULL prices). `setItemFormat` links a quotation line to a catalog format code.
 */

import { Result } from '@common/result';

export interface MachineFormatRow {
  id: number;
  format_code: string;
  label: string | null;
  max_sheet_width_mm: string | null;
  max_sheet_height_mm: string | null;
  price_per_1000_sheets: string | null;
  price_adjustment_percent: string | null;
  is_active: boolean;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ItemFormatRow {
  id: number;
  machine_format: string | null;
}

export interface CreateMachineFormatInput {
  formatCode: string;
  label?: string | null;
  maxSheetWidthMm?: number | null;
  maxSheetHeightMm?: number | null;
  pricePer1000Sheets?: number | null;
  priceAdjustmentPercent?: number | null;
  isActive?: boolean;
}

export interface UpdateMachineFormatInput {
  label?: string | null;
  maxSheetWidthMm?: number | null;
  maxSheetHeightMm?: number | null;
  pricePer1000Sheets?: number | null;
  priceAdjustmentPercent?: number | null;
  isActive?: boolean;
}

export const SD_MACHINE_FORMAT_REPO = Symbol('SD_MACHINE_FORMAT_REPO');

export interface ISdMachineFormatRepo {
  listFormats(activeOnly: boolean): Promise<Result<MachineFormatRow[]>>;
  createFormat(input: CreateMachineFormatInput): Promise<Result<MachineFormatRow>>;
  updateFormat(id: number, patch: UpdateMachineFormatInput): Promise<Result<MachineFormatRow>>;
  setItemFormat(itemId: number, formatCode: string): Promise<Result<ItemFormatRow>>;
}
