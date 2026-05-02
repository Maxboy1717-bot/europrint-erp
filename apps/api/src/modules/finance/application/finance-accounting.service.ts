import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { safeInt } from '../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { DrizzleFinanceAccountingRepo } from '../infrastructure/repositories/drizzle-finance-accounting.repo';

@Injectable()
export class FinanceAccountingService {
  private readonly logger = new Logger(FinanceAccountingService.name);

  constructor(private readonly accountingRepo: DrizzleFinanceAccountingRepo) {}

  async getDashboard() {
    return this.accountingRepo.getDashboard();
  }

  async getAccounts(type?: string, limit = 50, offset = 0) {
    const result = await this.accountingRepo.findAccounts(type, limit, offset);
    if (!result.ok) {
      this.logger.error('getAccounts error', result.error);
      return { items: [] as Record<string, unknown>[], total: 0 };
    }
    return { items: result.data, total: result.data.length };
  }

  async getGlDocuments(status?: string, documentType?: string, startDate?: string, endDate?: string, limitParam?: string, offsetParam?: string) {
    const limitVal  = safeInt(limitParam, 50);
    const offsetVal = safeInt(offsetParam, 0);
    return this.accountingRepo.getGlDocumentsFiltered({ status, documentType, startDate, endDate }, limitVal, offsetVal);
  }

  async createGlDocument(body: Record<string, unknown>) {
    const seq = await this.accountingRepo.getGlDocumentSeq();
    const documentNumber = `GL-${seq}`;
    const doc = await this.accountingRepo.insertGlDocument(documentNumber, body);
    const lineArr = (body.lines ?? []) as Array<Record<string, unknown>>;
    for (let i = 0; i < lineArr.length; i++) {
      await this.accountingRepo.insertGlLine(doc.id as number, i + 1, lineArr[i]);
    }
    return doc;
  }

  async getPeriods() {
    return this.accountingRepo.getPeriods();
  }

  async getPeriod(id: number) {
    return this.accountingRepo.getPeriodById(id);
  }

  async closePeriod(id: number, closedBy: number | null) {
    return this.accountingRepo.closePeriod(id, closedBy);
  }

  async getMaterials(warehouseId?: string, startDate?: string, endDate?: string, moveType?: string, limitParam?: string, offsetParam?: string) {
    const limitVal  = safeInt(limitParam, 100);
    const offsetVal = safeInt(offsetParam, 0);
    return this.accountingRepo.getMaterialsFiltered({ warehouseId, startDate, endDate, moveType }, limitVal, offsetVal);
  }

  async getMaterialsByOrder(orderId: string) {
    const { moves, summary } = await this.accountingRepo.getMaterialsByOrder(orderId);
    const s = summary as Record<string, unknown>;
    return {
      moves,
      summary: { totalQuantity: Number(s.total_quantity) || 0, totalCost: Number(s.total_cost) || 0, moveCount: Number(s.move_count) || 0 },
    };
  }

  async getInventoryValuation() {
    const { materials, summary } = await this.accountingRepo.getInventoryValuation();
    const s = summary as Record<string, unknown>;
    return {
      materials,
      summary: { totalItems: Number(s.total_items) || 0, totalStock: Number(s.total_stock) || 0, totalValue: Number(s.total_value) || 0 },
    };
  }

  async getExpenseReports(status?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const statusParam = status ?? null;
    const r: Result<Record<string, unknown>[]> = await safeCall(() => this.accountingRepo.getExpenseReports(statusParam, limit, offset));
    if (!r.ok) { this.logger.warn(`getExpenseReports: ${r.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    return { data: r.data, pagination: { total: r.data.length, page, limit } };
  }

  async getExpenseReportById(id: string) {
    const r = await safeCall(() => this.accountingRepo.getExpenseReportById(id));
    if (!r.ok) { this.logger.warn(`getExpenseReportById(${id}): ${r.error}`); throw new NotFoundException(String(r.error)); }
    return r.data;
  }
}
