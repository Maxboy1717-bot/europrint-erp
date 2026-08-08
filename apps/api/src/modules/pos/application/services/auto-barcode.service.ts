/**
 * auto-barcode.service.ts
 *
 * EXTERNAL_IN (Tashqi Kirim) yaratilganda — har qator uchun
 * avtomatik Code-128 barkod yaratadi va pos_barcode_print_queue ga qo'shadi.
 *
 * Format: {KOD}-{YYYYMMDD}-{RND6}
 *   Misol: PAPER001-20260511-A3F1B2
 *
 * Bu xizmat PosEventHandler ichida `pos.movement.data.created` event ga
 * o'rnatiladi yoki to'g'ridan-to'g'ri MovementService dan chaqiriladi.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppError } from '@common/result';
import { AutoBarcodeRepository, MovementLineForBarcode } from '../../infrastructure/repositories/auto-barcode.repository';

export type { MovementLineForBarcode } from '../../infrastructure/repositories/auto-barcode.repository';

// C8.1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): pos_barcode_print_queue (view over
// barcode_print_queue) now has a live UNIQUE constraint on barcode — a collision surfaces as a
// Postgres 23505 instead of silently succeeding. Bounded retry with a fresh random suffix turns
// that loud failure back into a successful print-queue entry without looping forever.
const MAX_BARCODE_COLLISION_RETRIES = 3;
const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AutoBarcodeService {
  private readonly logger = new Logger(AutoBarcodeService.name);

  constructor(private readonly repo: AutoBarcodeRepository) {}

  private generateBarcode(materialCode: string | null, _batchNumber: string | null): string {
    const safeCode = (materialCode ?? 'MAT').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 15);
    const date     = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rnd      = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${safeCode}-${date}-${rnd}`;
  }

  private async insertBarcodeWithRetry(
    movementId: number,
    toWarehouseId: number | null,
    line: MovementLineForBarcode,
  ): Promise<{ line: MovementLineForBarcode; barcode: string; insR: Result<void, AppError> }> {
    let barcode = '';
    let insR: Result<void, AppError> = Err({ message: 'not attempted', code: 'DB_ERROR' });
    for (let attempt = 1; attempt <= MAX_BARCODE_COLLISION_RETRIES; attempt++) {
      barcode = this.generateBarcode(line.materialCode, line.batchNumber);
      insR = await this.repo.insertBarcode({
        movementId,
        movementLineId: line.movementLineId,
        materialCardId: line.materialCardId,
        warehouseId:    toWarehouseId,
        batchNumber:    line.batchNumber,
        quantity:       line.quantity,
        unit:           line.unit ?? null,
        barcode,
      });
      if (insR.ok) break;
      const pgCode = (insR.error.details as { pgCode?: string } | undefined)?.pgCode;
      if (pgCode !== POSTGRES_UNIQUE_VIOLATION) break; // a different failure kind — don't retry
      this.logger.warn(`[AutoBarcode] Barkod to'qnashuvi (${barcode}), qayta urinish ${attempt}/${MAX_BARCODE_COLLISION_RETRIES}`);
    }
    return { line, barcode, insR };
  }

  async generateForMovement(movementId: number): Promise<Result<{ created: number }, AppError>> {
    try {
      this.logger.log(`[AutoBarcode] Movement ${movementId} uchun barkodlar yaratilmoqda...`);

      const movR = await this.repo.findMovement(movementId);
      if (!movR.ok) return { ok: false, error: movR.error };
      const mov = movR.data;
      if (!mov) {
        return Err({ message: 'Harakat topilmadi', code: 'NOT_FOUND' });
      }
      if (mov.movement_type !== 'EXTERNAL_IN') {
        this.logger.log(`[AutoBarcode] Movement ${movementId} EXTERNAL_IN emas (${mov.movement_type}), barkod o'tkazib yuborildi`);
        return Ok({ created: 0 });
      }

      const linesR = await this.repo.findLines(movementId);
      if (!linesR.ok) return { ok: false, error: linesR.error };
      const lines = linesR.data;
      if (lines.length === 0) return Ok({ created: 0 });

      // Pattern 2: per-line barcode inserts are independent — fan out in parallel
      const insResults = await Promise.all(lines.map((line) =>
        this.insertBarcodeWithRetry(movementId, mov.to_warehouse_id, line),
      ));
      let created = 0;
      for (const { line, barcode, insR } of insResults) {
        if (insR.ok) {
          created++;
          this.logger.log(`[AutoBarcode] ✅ ${barcode} → material ${line.materialCardId} (${line.quantity} ${line.unit ?? ''})`);
        } else {
          this.logger.warn(`[AutoBarcode] ⚠️ ${line.materialCardId} uchun xato: ${insR.error.message}`);
        }
      }

      this.logger.log(`[AutoBarcode] Movement ${movementId}: ${created}/${lines.length} ta barkod yaratildi`);
      return Ok({ created });
    } catch (e) {
      this.logger.error(`[AutoBarcode] Asosiy xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listForMovement(movementId: number) {
    return this.repo.listForMovement(movementId);
  }
}
