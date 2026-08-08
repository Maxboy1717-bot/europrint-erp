/**
 * @module drizzle-sd-machine-format.repo
 * @description SD machine-format catalog (72/52SM/KVA) rec+price — vision 06-sd #102. Parametrised raw
 *   SQL via `typedExecute` (no Drizzle schema object for the new sd_machine_format_prices table — same
 *   pattern as drizzle-sd-lost-orders-reclamations.repo.ts). repo-owns-DB (Qoida 15); Result<T> (Qoida 1).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Ok, Err, AppErr, Result, safeCall } from '@common/result';
import {
  ISdMachineFormatRepo, MachineFormatRow, ItemFormatRow,
  CreateMachineFormatInput, UpdateMachineFormatInput,
} from '../../domain/repositories/i-sd-machine-format.repo';

@Injectable()
export class DrizzleSdMachineFormatRepo implements ISdMachineFormatRepo {
  private readonly logger = new Logger(DrizzleSdMachineFormatRepo.name);

  async listFormats(activeOnly: boolean): Promise<Result<MachineFormatRow[]>> {
    return safeCall(async () => {
      return typedExecute<MachineFormatRow>(sql`
        SELECT * FROM sd_machine_format_prices
        WHERE deleted_at IS NULL
          AND (${activeOnly} = false OR is_active = true)
        ORDER BY format_code
      `);
    }, 'DB_ERROR');
  }

  async createFormat(input: CreateMachineFormatInput): Promise<Result<MachineFormatRow>> {
    try {
      const rows = await typedExecute<MachineFormatRow>(sql`
        INSERT INTO sd_machine_format_prices
          (format_code, label, max_sheet_width_mm, max_sheet_height_mm,
           price_per_1000_sheets, price_adjustment_percent, is_active)
        VALUES (
          ${input.formatCode}, ${input.label ?? null},
          ${input.maxSheetWidthMm ?? null}, ${input.maxSheetHeightMm ?? null},
          ${input.pricePer1000Sheets ?? null}, ${input.priceAdjustmentPercent ?? 0},
          ${input.isActive ?? true}
        )
        RETURNING *
      `);
      const row = rows[0];
      if (!row) return Err(AppErr('DB_ERROR', 'Machine-format insert returned no row'));
      return Ok(row);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err?.code === '23505') return Err(AppErr('CONFLICT', `Format kodi '${input.formatCode}' allaqachon mavjud`));
      this.logger.error('createFormat failed', e as Error);
      return Err(AppErr('DB_ERROR', err?.message ?? 'Machine-format insert failed'));
    }
  }

  async updateFormat(id: number, patch: UpdateMachineFormatInput): Promise<Result<MachineFormatRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<MachineFormatRow>(sql`
        UPDATE sd_machine_format_prices SET
          label                    = COALESCE(${patch.label ?? null}, label),
          max_sheet_width_mm       = COALESCE(${patch.maxSheetWidthMm ?? null}, max_sheet_width_mm),
          max_sheet_height_mm      = COALESCE(${patch.maxSheetHeightMm ?? null}, max_sheet_height_mm),
          price_per_1000_sheets    = COALESCE(${patch.pricePer1000Sheets ?? null}, price_per_1000_sheets),
          price_adjustment_percent = COALESCE(${patch.priceAdjustmentPercent ?? null}, price_adjustment_percent),
          is_active                = COALESCE(${patch.isActive ?? null}, is_active),
          updated_at = now()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING *
      `);
      const row = rows[0];
      if (!row) throw new Error(`Machine-format ${id} topilmadi`);
      return row;
    }, 'NOT_FOUND');
  }

  async setItemFormat(itemId: number, formatCode: string): Promise<Result<ItemFormatRow>> {
    try {
      // The format must exist + be active in the catalog (the rec+price linkage) — else VALIDATION.
      const fmt = await typedExecute<{ ok: number }>(sql`
        SELECT 1 AS ok FROM sd_machine_format_prices
        WHERE format_code = ${formatCode} AND deleted_at IS NULL AND is_active = true
        LIMIT 1
      `);
      if (!fmt[0]) return Err(AppErr('VALIDATION', `Noma'lum yoki nofaol mashina formati '${formatCode}'`));
      const rows = await typedExecute<ItemFormatRow>(sql`
        UPDATE sd_quotation_items SET machine_format = ${formatCode}
        WHERE id = ${itemId} AND deleted_at IS NULL
        RETURNING id, machine_format
      `);
      const row = rows[0];
      if (!row) return Err(AppErr('NOT_FOUND', `Kotirovka qatori ${itemId} topilmadi`));
      return Ok(row);
    } catch (e) {
      this.logger.error('setItemFormat failed', e as Error);
      return Err(AppErr('DB_ERROR', (e as Error)?.message ?? 'setItemFormat failed'));
    }
  }
}
