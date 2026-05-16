/**
 * @module employee-write-off.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Employee Write-Off & Liability Service
 *
 * Hisobdan chiqarish aktlari va javobgarlik ishlari uchun servis.
 * EmployeeLedgerService ga ledger yozuvlari uchun delegatsiya qiladi.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { employeeWriteOffActs, employeeWriteOffActLines, db, eq, count } from '@workspace/db';

import { EmployeeLedgerService } from './employee-ledger.service';
import { EmployeeWriteOffRepository } from '../../infrastructure/repositories/employee-write-off.repository';

export interface CreateWriteOffActInput {
  userId:        number;
  warehouseId:   string;
  writeOffDate?: string;
  reason:        string;
  lines: Array<{
    ledgerEntryId?:      number;
    materialCardId?:     number;
    quantity?:           number;
    serialNumberItemId?: number;
    notes?:              string;
  }>;
}

export interface UpdateLiabilityCaseInput {
  status:              string;
  compensationAmount?: number;
  compensationDate?:   string;
  closedAt?:           string;
}

@Injectable()
export class EmployeeWriteOffService {
  constructor(
    private readonly ledgerService: EmployeeLedgerService,
    private readonly writeOffRepo: EmployeeWriteOffRepository,
  ) {}

  /**
   * Hisobdan chiqarish akti yaratish — akt yaratadi, satrlarni qo'shadi,
   * ledger CREDIT yozuvlarini kiritadi va aktni approved holatiga o'tkazadi.
   */

  async createWriteOffAct(input: CreateWriteOffActInput, createdBy: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [{ count: rowCount }] = await db
        .select({ count: count() })
        .from(employeeWriteOffActs);
      const actNumber = `WO-${_time.now().getFullYear()}-${String(Number(rowCount) + 1).padStart(5, '0')}`;
  
      const [act] = await db
        .insert(employeeWriteOffActs)
        .values({
          actNumber,
          userId:       input.userId,
          warehouseId:  input.warehouseId,
          writeOffDate: input.writeOffDate ? new Date(input.writeOffDate) : _time.now(),
          reason:       input.reason,
          createdBy,
          status:       'draft',
        } as typeof employeeWriteOffActs.$inferInsert)
        .returning();
  
      const lineValues = (Array.isArray(input?.lines) ? input?.lines : []).map(line => ({
        actId:              act.id,
        ledgerEntryId:      line.ledgerEntryId,
        materialCardId:     line.materialCardId,
        quantity:           line.quantity != null ? Number(line.quantity) : undefined,
        serialNumberItemId: line.serialNumberItemId,
        notes:              line.notes,
      }));
  
      await db
        .insert(employeeWriteOffActLines)
        .values(lineValues as typeof employeeWriteOffActLines.$inferInsert[]);
  
      for (const line of input.lines) {
        if (line.materialCardId == null || line.quantity == null) continue;
        await this.ledgerService.addEntry({
          userId:         input.userId,
          materialCardId: line.materialCardId,
          warehouseId:    input.warehouseId,
          entryType:      'CREDIT',
          quantity:       line.quantity,
          unitPrice:      0,
          referenceType:  'write_off_act',
          referenceId:    act.id,
          notes:          `Hisobdan chiqarish akti: ${actNumber}`,
        });
      }
  
      await db
        .update(employeeWriteOffActs)
        .set({ status: 'approved', approvedBy: createdBy, approvedAt: _time.now() })
        .where(eq(employeeWriteOffActs.id, act.id));
  
      return { ...act, status: 'approved', linesCount: input.lines.length };
    });
  }

  /**
   * Javobgarlik ishi statusini yangilash.
   */
  async updateLiabilityCase(id: number, updates: UpdateLiabilityCaseInput, actorId: number) {
    return this.writeOffRepo.updateLiabilityCase(id, {
      status:            updates.status,
      compensatedAmount: updates.compensationAmount,
      compensationDate:  updates.compensationDate,
      closedAt:          updates.closedAt,
      closedBy:          updates.status === 'CLOSED' ? actorId : undefined,
      updatedAt:         _time.now(),
    });
  }

  /**
   * Xodimning ochiq javobgarlik ishlarini olish (OPEN, UNDER_REVIEW).
   */
  async getOpenLiabilityCases(userId: number) {
    return this.writeOffRepo.getOpenLiabilityCases(userId);
  }
}
