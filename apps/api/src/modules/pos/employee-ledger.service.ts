import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * POS — Employee Ledger Service
 *
 * §38 ARCHITECTURE: Xodim moddiy javobgarlik daftarchasi
 *
 * Har bir material berish/qaytarish/hisobdan chiqarish — employee_inventory_ledger ga yoziladi.
 * Xodim balansini hisoblash: DEBIT qatorlar minus CREDIT qatorlar = joriy balans.
 *
 * DEBIT  = xodimga material berildi (u javobgar)
 * CREDIT = xodim material qaytardi / hisobdan chiqarildi
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { EmployeeLedgerRepository, EmployeeBalance } from './employee-ledger.repository';

export type { EmployeeBalance };

export interface LedgerEntry {
  userId:          number;
  materialCardId:  number;
  warehouseId:     string;
  entryType:       'DEBIT' | 'CREDIT';
  quantity:        number;
  unitPrice:       number;
  referenceType:   'pos_movement' | 'write_off_act' | 'inventory_count' | 'manual';
  referenceId:     number;
  notes?:          string;
}

@Injectable()
export class EmployeeLedgerService {
  private readonly logger = new Logger(EmployeeLedgerService.name);

  constructor(private readonly repo: EmployeeLedgerRepository) {}

  async addEntry(entry: LedgerEntry): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const totalPrice = entry.quantity * entry.unitPrice;
      const record = await this.repo.insertEntry({
        userId:        entry.userId,
        materialCardId: entry.materialCardId,
        warehouseId:   entry.warehouseId,
        entryType:     entry.entryType,
        quantity:      entry.quantity,
        unitPrice:     entry.unitPrice,
        totalAmount:   totalPrice,
        referenceType: entry.referenceType,
        referenceId:   entry.referenceId,
        notes:         entry.notes,
      });
      this.logger.debug(
        `Ledger: userId=${entry.userId} type=${entry.entryType} mat=${entry.materialCardId} qty=${entry.quantity}`,
      );
      return record;
    });
  }

  async getEmployeeBalance(
    userId: number,
    optionsOrMaterialCardId?: number | { onlyActive?: boolean; warehouseId?: string; materialCardId?: number },
  ): Promise<EmployeeBalance[]> {
    let materialCardId: number | undefined;
    let warehouseId:    string | undefined;

    if (typeof optionsOrMaterialCardId === 'number') {
      materialCardId = optionsOrMaterialCardId;
    } else if (optionsOrMaterialCardId) {
      materialCardId = optionsOrMaterialCardId.materialCardId;
      warehouseId    = optionsOrMaterialCardId.warehouseId;
    }

    const r = await this.repo.getEmployeeBalance(userId, materialCardId, warehouseId);
    return r.ok ? (r.data as EmployeeBalance[]) : [];
  }

  async getDepartmentBalance(departmentCode: string): Promise<EmployeeBalance[]> {
    const r = await this.repo.getDepartmentBalance(departmentCode);
    return r.ok ? (r.data as EmployeeBalance[]) : [];
  }

  async getEmployeeStatement(userId: number, dateFrom: Date, dateTo: Date) {
    return this.repo.getStatement(userId, dateFrom, dateTo);
  }

  async openLiabilityCase(data: {
    userId:            number;
    materialCardId:    number;
    serialNumberItemId?: number;
    warehouseId:       string;
    incidentType:      string;
    incidentDate:      Date;
    description:       string;
    quantity:          number;
    assessedValue?:    number;
    openedBy:          number;
  }) {
    const caseNumber = `LC-${_time.now().getFullYear()}-${Date.now().toString().slice(-6)}`;
    return this.repo.openLiabilityCase(caseNumber, {
      userId: data.userId, incidentType: data.incidentType,
      incidentDate: data.incidentDate, description: data.description,
      assessedValue: data.assessedValue, openedBy: data.openedBy,
    });
  }

  async getHistory(userId: number, options: { page?: number; limit?: number; materialCardId?: number } = {}) {
    const page   = options.page  ?? 1;
    const limit  = options.limit ?? 20;
    const offset = (page - 1) * limit;
    const ledgerR = await this.repo.findLedger(userId, options.materialCardId, limit, offset);
    const { items, total } = (ledgerR.ok ? ledgerR.data : { items: [], total: 0 }) as { items: unknown[]; total: number };
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async checkDismissalBlock(userId: number): Promise<{
    canDismiss: boolean;
    pendingItems: EmployeeBalance[];
  }> {
    const pendingItems = await this.getEmployeeBalance(userId);
    return { canDismiss: pendingItems.length === 0, pendingItems };
  }
}
