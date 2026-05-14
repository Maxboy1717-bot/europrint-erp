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
import { AutoBarcodeRepository } from '../repositories/auto-barcode.repository';

export type { MovementLineForBarcode } from '../repositories/auto-barcode.repository';

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
      const insResults = await Promise.all(lines.map(async (line) => {
        const barcode = this.generateBarcode(line.materialCode, line.batchNumber);
        const insR = await this.repo.insertBarcode({
          movementId,
          movementLineId: line.movementLineId,
          materialCardId: line.materialCardId,
          warehouseId:    mov.to_warehouse_id,
          batchNumber:    line.batchNumber,
          quantity:       line.quantity,
          unit:           line.unit ?? null,
          barcode,
        });
        return { line, barcode, insR };
      }));
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
