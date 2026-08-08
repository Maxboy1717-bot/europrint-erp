/**
 * @module gl.service
 * @description General-Ledger business logic. Wraps every repo call in
 * `safeCall` so the outermost return is always `Result<T>`. Posting a GL
 * document enforces the debit/credit balance invariant; mismatched totals
 * surface as 400 BadRequest, not a silent rounding. The chart-of-accounts
 * seed bootstraps the standard EuroPrint asset/liability/equity tree.
 */

import { GL } from "../domain/constants/gl-accounts.constants";
import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IFinanceGlRepository, FINANCE_GL_REPO } from './i-finance-gl.repo';
import { safeCall, Result, AppError } from '@common/result';
import { throwFromError } from '@common/http-result';

@Injectable()
export class GlService {
  private readonly logger = new Logger(GlService.name);

  constructor(
    @Inject(FINANCE_GL_REPO) private readonly financeGlRepo: IFinanceGlRepository,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Paginated list of GL documents.
   * @param query - { page?: number; limit?: number } from the request query string
   * @returns Result with `{ data, pagination: { total, page, limit } }`. On
   *   repo failure returns Ok with empty data so the dashboard doesn't break.
   */
  async findAllDocuments(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page   = Number((query.page  as number | undefined) ?? 1);
    const limit  = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.financeGlRepo.findAllDocuments(limit, offset);
    if (!result.ok) {
      this.logger.warn(`findAllDocuments: ${result.error}`);
      return { data: [], pagination: { total: 0, page, limit } };
    }
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findAllAccounts(){
    return safeCall(async () => {
    const result = await this.financeGlRepo.findAllAccounts();
    if (!result.ok) {
      this.logger.warn(`findAllAccounts: ${result.error}`);
      throw new InternalServerErrorException(String(result.error));
    }
    return result.data;
  
    });}

  /**
   * Look up one chart-of-accounts entry by primary key.
   * @param id - GL account id
   * @returns Result.ok(account) when found; the wrapped throw becomes
   *   Result.err('NOT_FOUND') so the controller produces a clean 404.
   */
  async findAccountById(id: number){
    const notFoundMsg = await this.i18n.t('errors.notFound');
    return safeCall(async () => {
    const result = await this.financeGlRepo.findAccountById(id);
    if (!result.ok) {
      this.logger.warn(`findAccountById(${id}): ${result.error}`);
      throw new NotFoundException(notFoundMsg);
    }
    if (!result.data) throw new NotFoundException(notFoundMsg);
    return result.data;

    });}

  /**
   * Seeds the chart of accounts. Idempotent via the repo (relies on
   * onConflictDoNothing). If `rows` is empty, the default EuroPrint chart
   * is used.
   * @param rows - account definitions, or empty for the built-in defaults
   * @returns Result.ok({ inserted: count })
   */
  async seedAccounts(rows: Record<string, unknown>[]){
    return safeCall(async () => {
    const payload = rows.length > 0 ? rows : this.defaultChartOfAccounts();
    const result  = await this.financeGlRepo.seedAccounts(payload);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { inserted: (result.data as Record<string, unknown>[]).length };

    });}

  /**
   * Creates a single chart-of-accounts entry. Validation (required fields,
   * allowed accountType) and duplicate-code detection live in the repo and
   * surface as VALIDATION (→400) / CONFLICT (→409); `throwFromError` re-raises
   * the matching exception so `safeCall` re-tags the code for the controller.
   * @param dto - { accountNumber, accountName, accountType, parentId?, active? }
   * @returns Result.ok(inserted account row)
   */
  async createAccount(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.financeGlRepo.createAccount(dto);
    if (!result.ok) {
      this.logger.warn(`createAccount: ${result.error.message}`);
      throwFromError(result.error);
    }
    return result.data;

    });}

  async getTrialBalance(date?: string) {
    return safeCall(async () => {
      const result = await this.financeGlRepo.getTrialBalance(date);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async getLedger(accountCode: string, page = 1, limit = 50) {
    return safeCall(async () => {
      const offset = (page - 1) * limit;
      const result = await this.financeGlRepo.getLedger(accountCode, limit, offset);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  /**
   * Returns the built-in chart of accounts seed rows. Codes come from
   * `domain/constants/gl-accounts.constants.ts` so the entire codebase
   * references the same account numbers.
   */
  private defaultChartOfAccounts(): Record<string, unknown>[] {
    return [
      { accountCode: GL.CASH, accountName: 'Asosiy kassa',              accountType: 'asset'     },
      { accountCode: GL.ACCOUNTS_RECEIVABLE, accountName: 'Debitorlik qarzlar',         accountType: 'asset'     },
      { accountCode: GL.INVENTORY_ADJ, accountName: 'Tovar va materiallar',        accountType: 'asset'     },
      { accountCode: GL.FIXED_ASSETS, accountName: 'Asosiy vositalar',           accountType: 'asset'     },
      { accountCode: GL.ACCOUNTS_PAYABLE, accountName: 'Kreditorlik qarzlar',        accountType: 'liability' },
      { accountCode: GL.SHORT_TERM_LOANS, accountName: 'Qisqa muddatli kreditlar',   accountType: 'liability' },
      { accountCode: GL.CAPITAL, accountName: 'Ustav kapitali',             accountType: 'equity'    },
      { accountCode: GL.REVENUE, accountName: 'Savdo tushumlari',           accountType: 'revenue'   },
      { accountCode: GL.MATERIAL_EXPENSE, accountName: 'Moddiy xarajatlar',          accountType: 'expense'   },
      { accountCode: GL.LABOR_EXPENSE, accountName: 'Mehnat haqi xarajatlari',    accountType: 'expense'   },
    ];
  }
}
