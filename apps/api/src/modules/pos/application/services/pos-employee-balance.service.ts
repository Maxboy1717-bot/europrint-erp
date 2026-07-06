/**
 * @module pos-employee-balance.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Employee Balance Service
 *
 * Xodimning shaxsiy inventar holati:
 *  - getMyInventory     — joriy qo'ldagi materiallar
 *  - requestReturn      — material qaytarish so'rovi (INTERNAL_RETURN harakati)
 *  - writeOffItem       — shikast/yo'qotish (DAMAGE harakati + CREDIT ledger)
 *  - checkHRBlock       — HR blokirovka tekshiruvi (ishdan chiqish)
 *  - getHRChecklist     — chiqish cheklovi (to'liq ro'yxat)
 */

import {
  Injectable, Logger, BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, safeCall } from '@common/result';

import { EmployeeLedgerService, EmployeeBalance } from './employee-ledger.service';
import { PosMovementService }                     from './pos-movement.service';
import { PosNotificationsService }                from './pos-notifications.service';
import { PosEmployeeBalanceRepository }           from '../../infrastructure/repositories/pos-employee-balance.repository';
import type { EmployeeInventoryItem }             from '../../infrastructure/repositories/pos-employee-balance.repository';

export type { EmployeeInventoryItem } from '../../infrastructure/repositories/pos-employee-balance.repository';

@Injectable()
export class PosEmployeeBalanceService {
  private readonly logger = new Logger(PosEmployeeBalanceService.name);

  constructor(
    private readonly employeeLedger:  EmployeeLedgerService,
    private readonly movementService: PosMovementService,
    private readonly notifService:    PosNotificationsService,
    private readonly repo:            PosEmployeeBalanceRepository,
    private readonly i18n:            I18nService,
  ) {}

  // ─── getMyInventory ────────────────────────────────────────────────────────

  async getMyInventory(userId: number): Promise<Result<EmployeeInventoryItem[], AppError>> {
    return this.repo.getInventory(userId);
  }

  // ─── requestReturn ─────────────────────────────────────────────────────────
  // Creates an INTERNAL_RETURN movement in DRAFT status (needs approval).

  async requestReturn(
    userId:         number,
    materialCardId: number,
    quantity:       number,
    reason?:        string,
  ): Promise<Result<{ movementId: number }, AppError>> {
    return safeCall(async () => {
      if (quantity <= 0) {
        throw new BadRequestException(await this.i18n.t('validation.quantityMustBePositive'));
      }

      // Verify employee actually holds this material
      const balance = await this.employeeLedger.getEmployeeBalance(userId, { materialCardId });
      const item = (Array.isArray(balance) ? balance : []).find(
        (b: EmployeeBalance) => b.materialCardId === materialCardId,
      );
      if (!item || (item.balance ?? 0) < quantity) {
        throw new BadRequestException(
          await this.i18n.t('errors.employeeInsufficientMaterialBalance', {
            args: { available: item?.balance ?? 0, requested: quantity },
          }),
        );
      }

      // INTERNAL_RETURN movement in DRAFT (no auto-submit)
      const movementR = await this.movementService.createMovement(
        {
          movementTypeCode:     'INTERNAL_RETURN',
          receivedByEmployeeId: userId,
          returnReason:         reason ?? 'Xodim qaytarishi',
          lines: [{
            materialCardId,
            quantity,
            unitPrice: item.totalValue / (item.balance || 1),
          }],
          submit: false,
        },
        userId,
      );

      if (!movementR.ok) {
        throw new InternalServerErrorException(movementR.error.message);
      }
      const mv = movementR.data as { id: number };
      this.logger.log(`Return movement created: movementId=${mv.id} userId=${userId} mat=${materialCardId}`);
      return { movementId: mv.id };
    });
  }

  // ─── writeOffItem ──────────────────────────────────────────────────────────

  async writeOffItem(
    userId:          number,
    materialCardId:  number,
    quantity:        number,
    reason:          string,
    writtenOffById:  number,
  ): Promise<Result<{ movementId: number; ledgerEntryId: unknown }, AppError>> {
    return safeCall(async () => {
      if (!reason || reason.trim().length === 0) {
        throw new BadRequestException(await this.i18n.t('validation.reasonRequired'));
      }
      if (quantity <= 0) {
        throw new BadRequestException(await this.i18n.t('validation.quantityMustBePositive'));
      }

      // Verify employee balance
      const balance = await this.employeeLedger.getEmployeeBalance(userId, { materialCardId });
      const item = (Array.isArray(balance) ? balance : []).find(
        (b: EmployeeBalance) => b.materialCardId === materialCardId,
      );
      if (!item || (item.balance ?? 0) < quantity) {
        throw new BadRequestException(
          await this.i18n.t('errors.employeeInsufficientMaterialBalance', {
            args: { available: item?.balance ?? 0, requested: quantity },
          }),
        );
      }

      // Create DAMAGE movement
      const movementR = await this.movementService.createMovement(
        {
          movementTypeCode:     'DAMAGE',
          receivedByEmployeeId: userId,
          lines: [{
            materialCardId,
            quantity,
            unitPrice: item.totalValue / (item.balance || 1),
          }],
          notes:  reason,
          submit: false,
        },
        writtenOffById,
      );

      if (!movementR.ok) {
        throw new InternalServerErrorException(movementR.error.message);
      }
      const mv = movementR.data as { id: number };

      // Add CREDIT to employee ledger
      const unitPrice = item.totalValue / (item.balance || 1);
      const ledgerR = await this.employeeLedger.addEntry({
        userId,
        materialCardId,
        warehouseId:   item.warehouseId ?? 'default',
        entryType:     'CREDIT',
        quantity,
        unitPrice,
        referenceType: 'pos_movement',
        referenceId:   mv.id,
        notes:         `Hisobdan chiqarish: ${reason}`,
      });

      const ledgerEntry = ledgerR.ok ? (ledgerR.data as { id?: unknown }) : { id: null };

      // Notify finance and director via system notifications (best-effort)
      const notifyTargets: Array<{ role: string; msg: string }> = [
        { role: 'finance', msg: `Hisobdan chiqarish: userId=${userId} mat=${materialCardId} qty=${quantity}. Sabab: ${reason}` },
        { role: 'director', msg: `Hisobdan chiqarish: userId=${userId} mat=${materialCardId} qty=${quantity}. Sabab: ${reason}` },
      ];

      for (const t of notifyTargets) {
        // Look up users by role and notify them (we only know userId, so we broadcast)
        await this.notifService.broadcastNotification(
          'WRITE_OFF_ALERT',
          `Hisobdan chiqarish (${t.role})`,
          t.msg,
          'pos_movements',
          mv.id,
        ).catch((e: unknown) => this.logger.warn(`Notify writeOff ${t.role} failed: ${String(e)}`));
      }

      this.logger.log(`Write-off: userId=${userId} mat=${materialCardId} qty=${quantity} movementId=${mv.id}`);
      return { movementId: mv.id, ledgerEntryId: ledgerEntry?.id };
    });
  }

  // ─── checkHRBlock ──────────────────────────────────────────────────────────

  async checkHRBlock(userId: number): Promise<{
    hasOutstandingItems: boolean;
    items: EmployeeInventoryItem[];
  }> {
    const inventoryR = await this.getMyInventory(userId);
    const items = inventoryR.ok ? inventoryR.data : [];
    return {
      hasOutstandingItems: items.length > 0,
      items,
    };
  }

  // ─── getHRChecklist ────────────────────────────────────────────────────────

  async getHRChecklist(userId: number): Promise<Result<EmployeeInventoryItem[], AppError>> {
    return this.repo.getChecklist(userId);
  }
}
