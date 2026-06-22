/**
 * @module fi.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException, Inject } from '@nestjs/common';
import { IFiRepository, FI_REPO } from './i-fi.repo';
import { safeCall, Result, AppError } from '@common/result';
import { GlPostingService, JournalLine } from '../domain/services/gl-posting.service';

@Injectable()
export class FiService {
  private readonly logger = new Logger(FiService.name);
  constructor(
    @Inject(FI_REPO) private readonly repo: IFiRepository,
    private readonly glPosting: GlPostingService,
  ) {}

  async findAccountingPeriods(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findAccountingPeriods(limit, (page - 1) * limit);
    if (!result.ok) { this.logger.warn(`findAccountingPeriods: ${result.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async createAccountingPeriod(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.createAccountingPeriod(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async closeAccountingPeriod(id: number){
    return safeCall(async () => {
    const result = await this.repo.closeAccountingPeriod(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Hisob davri #${id} topilmadi`);
    return result.data;
  
    });}

  async postGlDocument(id: number){
    return safeCall(async () => {
    const result = await this.repo.postGlDocument(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`GL hujjat #${id} topilmadi`);
    return result.data;
  
    });}

  async findPayments(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findPayments(limit, (page - 1) * limit);
    if (!result.ok) { this.logger.warn(`findPayments: ${result.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async createPayment(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.createPayment(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async getCostCenters(): Promise<Array<{ id: string; name: string; code: string }>> {
    // Cost centers are a relatively stable config; return from repo or fallback defaults
    try {
      const result = await this.repo.getCostCenters();
      if (result.ok && Array.isArray(result.data)) return result.data as Array<{ id: string; name: string; code: string }>;
    } catch (_e) {
      this.logger.warn('getCostCenters: using defaults');
    }
    return [
      { id: '1', name: "Ishlab chiqarish", code: "CC-001" },
      { id: '2', name: "Sotish va Marketing", code: "CC-002" },
      { id: '3', name: "Umumiy va Ma'muriy", code: "CC-003" },
      { id: '4', name: "IT va Texnologiya", code: "CC-004" },
    ];
  }

  async createCostCenter(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.createCostCenter(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async updateCostCenter(id: number, dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.updateCostCenter(id, dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async deleteCostCenter(id: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.deleteCostCenter(id);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { success: true };
    });
  }

  async getStats(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.getStats();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async getRecentTransactions(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.getRecentTransactions(20);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async findGlDocuments(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 20);
      const result = await this.repo.findGlDocuments(limit, (page - 1) * limit);
      if (!result.ok) { this.logger.warn(`findGlDocuments: ${result.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
      return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
    });
  }

  /**
   * Create a GL document = post a BALANCED double-entry journal to the canonical `entries` ledger
   * (SAP#76: `entries` is the ONE money ledger; gl_lines/gl_documents are NOT the ledger of record).
   *
   * Honest contract (Q-40, Q-43):
   *  - The request `lines[]` are summed; each leg carries an account code (`accountCode` or, as a
   *    string code, `account_id`) plus `debit`/`credit`.
   *  - If ΣDebit == ΣCredit (within 0.01) AND there is at least one debit leg and one credit leg,
   *    we post real balanced rows via the ONE engine (GlPostingService → resolves codes → accounts.id
   *    → INSERT into `entries`). The header is NOT written to gl_documents — entries is the truth.
   *  - Otherwise (e.g. the current FE single-debit line with no contra) we return a CLEAR 400. We do
   *    NOT silently persist a header, do NOT write gl_lines, and do NOT invent a contra account.
   */
  async createGlDoc(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rawLines = Array.isArray(dto.lines) ? (dto.lines as Array<Record<string, unknown>>) : [];
      if (rawLines.length === 0) {
        throw new BadRequestException(
          "GL hujjati uchun kamida ikkita yozuv (debet va kredit) kerak. Bo'sh hujjat saqlanmaydi.",
        );
      }

      // Map each document line to a JournalLine. The account is identified by code (`accountCode`);
      // `account_id` is accepted only when it is itself a code string (no silent wrong-account post).
      const lines: JournalLine[] = rawLines.map((l) => {
        const accountCode = String(l.accountCode ?? l.account_id ?? l.accountId ?? '').trim();
        const debit = Number(l.debit ?? 0) || 0;
        const credit = Number(l.credit ?? 0) || 0;
        const accountName = String(l.accountName ?? l.account_name ?? accountCode);
        return { accountCode, accountName, debit, credit };
      });

      const totalDebit = lines.reduce((s, l) => s + (l.debit > 0 ? l.debit : 0), 0);
      const totalCredit = lines.reduce((s, l) => s + (l.credit > 0 ? l.credit : 0), 0);
      const hasDebitLeg = lines.some((l) => l.debit > 0);
      const hasCreditLeg = lines.some((l) => l.credit > 0);

      // Double-entry balance is REQUIRED. The current FE sends a single debit line with no contra —
      // that is genuinely unbalanced and is rejected here (an honest error beats a fake-green header).
      if (!hasDebitLeg || !hasCreditLeg || Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new BadRequestException(
          `Ikki tomonlama balans talab qilinadi: debet (${totalDebit}) = kredit (${totalCredit}) ` +
            `bo'lishi shart va kamida bitta debet hamda bitta kredit yozuvi (kontra hisob) kerak. ` +
            `Kontra hisob avtomatik tanlanmaydi — uni hujjat yozuvlariga qo'shing.`,
        );
      }

      // Balanced → post to the canonical entries ledger via the ONE engine.
      const reference = String(dto.documentNumber ?? `GLDOC-${Date.now()}`);
      const posted = await this.glPosting.postJournal(lines, reference);
      if (!posted.ok) {
        // Account-not-in-chart / DB failures surface honestly (no header, no gl_lines).
        throw new BadRequestException(
          typeof posted.error === 'string' ? posted.error : posted.error.message,
        );
      }

      return {
        entryId: posted.data,
        reference,
        documentDate: dto.documentDate ?? dto.document_date ?? null,
        description: dto.description ?? null,
        totalDebit,
        totalCredit,
        lines,
        ledger: 'entries',
      };
    });
  }

  async findProfitCenters(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.findProfitCenters();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async createProfitCenter(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.createProfitCenter(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async updateProfitCenter(id: number, dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.updateProfitCenter(id, dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      if (!result.data) throw new NotFoundException(`Foyda markazi #${id} topilmadi`);
      return result.data;
    });
  }

  async deleteProfitCenter(id: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.deleteProfitCenter(id);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { success: true };
    });
  }

  async getTaxSummary(): Promise<Result<{ totalThisMonth: number; paid: number; pending: number; overdue: number }, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.getTaxSummary();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }
}
