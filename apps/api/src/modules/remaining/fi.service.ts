import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { FiRepository } from './fi.repository';

@Injectable()
export class FiService {
  private readonly logger = new Logger(FiService.name);

  constructor(private readonly repo: FiRepository) {}

  async getStats(): Promise<Result<object, AppError>> {
    const [revR, expR, unpaidR] = await Promise.all([
      safeCall(() => this.repo.getRevenue()),
      safeCall(() => this.repo.getExpenses()),
      safeCall(() => this.repo.getUnpaidStats()),
    ]);
    if (!revR.ok)    this.logger.warn(`getStats rev: ${revR.error}`);
    if (!expR.ok)    this.logger.warn(`getStats exp: ${expR.error}`);
    if (!unpaidR.ok) this.logger.warn(`getStats unpaid: ${unpaidR.error}`);
    return Ok({
      revenue:        Number(revR.ok    ? (dbRows(revR.data)[0]?.['total']    ?? 0) : 0),
      expenses:       Number(expR.ok    ? (dbRows(expR.data)[0]?.['total']    ?? 0) : 0),
      unpaidInvoices: Number(unpaidR.ok ? (dbRows(unpaidR.data)[0]?.['count']  ?? 0) : 0),
      unpaidAmount:   Number(unpaidR.ok ? (dbRows(unpaidR.data)[0]?.['amount'] ?? 0) : 0),
    });
  }

  async getRecentTransactions() {
    const r = await safeCall(() => this.repo.getRecentTransactions());
    if (!r.ok) { this.logger.warn(`getRecentTransactions: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async getCostCenters() {
    const r = await safeCall(() => this.repo.getCostCenters());
    if (!r.ok) { this.logger.warn(`getCostCenters: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async getCostCenter(id: string) {
    const r = await safeCall(() => this.repo.getCostCenter(id));
    if (!r.ok) { this.logger.warn(`getCostCenter(${id}): ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async createCostCenter(body: Record<string, unknown>) {
    const r = await safeCall(() => this.repo.createCostCenter(body));
    if (!r.ok) { this.logger.error(`createCostCenter: ${r.error}`); throw new InternalServerErrorException('Cost center yaratishda xatolik'); }
    return r.data;
  }

  async updateCostCenter(id: string, body: Record<string, unknown>) {
    const dto: { code?: string; name?: string; nameRu?: string; description?: string; isActive?: boolean } = {};
    if (body['name']        !== undefined) dto.name        = String(body['name']);
    if (body['nameRu']      !== undefined) dto.nameRu      = String(body['nameRu'] ?? '');
    if (body['code']        !== undefined) dto.code        = String(body['code'] ?? '');
    if (body['description'] !== undefined) dto.description = String(body['description'] ?? '');
    if (body['isActive']    !== undefined) dto.isActive    = Boolean(body['isActive']);
    const r = await safeCall(() => this.repo.updateCostCenter(id, dto));
    if (!r.ok) { this.logger.error(`updateCostCenter(${id}): ${r.error}`); throw new InternalServerErrorException('Cost center yangilashda xatolik'); }
    return r.data;
  }

  async deleteCostCenter(id: string) {
    const r = await safeCall(() => this.repo.deleteCostCenter(id));
    if (!r.ok) this.logger.error(`deleteCostCenter(${id}): ${r.error}`);
    return { success: r.ok };
  }

  async getProfitCenters() {
    const r = await safeCall(() => this.repo.getProfitCenters());
    if (!r.ok) { this.logger.warn(`getProfitCenters: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async getProfitCenter(id: string) {
    const r = await safeCall(() => this.repo.getProfitCenter(id));
    if (!r.ok) { this.logger.warn(`getProfitCenter(${id}): ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async createProfitCenter(body: Record<string, unknown>) {
    const r = await safeCall(() => this.repo.createProfitCenter(body));
    if (!r.ok) { this.logger.error(`createProfitCenter: ${r.error}`); throw new InternalServerErrorException('Profit center yaratishda xatolik'); }
    return r.data;
  }

  async updateProfitCenter(id: string, body: Record<string, unknown>) {
    const dto: { code?: string; name?: string; nameRu?: string; description?: string; isActive?: boolean } = {};
    if (body['name']     !== undefined) dto.name     = String(body['name']);
    if (body['nameRu']   !== undefined) dto.nameRu   = String(body['nameRu'] ?? '');
    if (body['code']     !== undefined) dto.code     = String(body['code'] ?? '');
    if (body['isActive'] !== undefined) dto.isActive = Boolean(body['isActive']);
    const r = await safeCall(() => this.repo.updateProfitCenter(id, dto));
    if (!r.ok) { this.logger.error(`updateProfitCenter(${id}): ${r.error}`); throw new InternalServerErrorException('Profit center yangilashda xatolik'); }
    return r.data;
  }

  async deleteProfitCenter(id: string) {
    const r = await safeCall(() => this.repo.deleteProfitCenter(id));
    if (!r.ok) this.logger.error(`deleteProfitCenter(${id}): ${r.error}`);
    return { success: r.ok };
  }

  async getGlDocuments() {
    const r = await safeCall(() => this.repo.getGlDocuments());
    if (!r.ok) { this.logger.warn(`getGlDocuments: ${r.error}`); throw new InternalServerErrorException(String(r.error)); }
    return r.data;
  }

  async createGlDocument(body: Record<string, unknown>) {
    const r = await safeCall(() => this.repo.createGlDocument(body));
    if (!r.ok) { this.logger.error(`createGlDocument: ${r.error}`); throw new InternalServerErrorException('GL hujjat yaratishda xatolik'); }
    return r.data;
  }

  async getGlEntries(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const r = await this.repo.getGlEntries(limit, offset);
    if (!r.ok) { this.logger.warn(`getGlEntries: ${r.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    const data = r.data as Record<string, unknown>[];
    return { data, pagination: { total: data.length, page, limit } };
  }

  async getInvoices(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const r = await this.repo.getInvoices(limit, offset);
    if (!r.ok) { this.logger.warn(`getInvoices: ${r.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    const data = r.data as Record<string, unknown>[];
    return { data, pagination: { total: data.length, page, limit } };
  }
}
