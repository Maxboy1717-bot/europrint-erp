import { GL } from "../domain/constants/gl-accounts.constants";
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { IFinanceGlRepository, FINANCE_GL_REPO } from './i-finance-gl.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class GlService {
  private readonly logger = new Logger(GlService.name);

  constructor(@Inject(FINANCE_GL_REPO) private readonly financeGlRepo: IFinanceGlRepository) {}

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

  async findAccountById(id: number){
    return safeCall(async () => {
    const result = await this.financeGlRepo.findAccountById(id);
    if (!result.ok) {
      this.logger.warn(`findAccountById(${id}): ${result.error}`);
      throw new NotFoundException(`GL hisob #${id} topilmadi`);
    }
    if (!result.data) throw new NotFoundException(`GL hisob #${id} topilmadi`);
    return result.data;
  
    });}

  async postDocument(dto: Record<string, unknown>){
    return safeCall(async () => {
    if (dto.totalDebit !== dto.totalCredit) {
      throw new BadRequestException('Debet va kredit mos kelishi kerak');
    }
    const result = await this.financeGlRepo.postDocument(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async seedAccounts(rows: Record<string, unknown>[]){
    return safeCall(async () => {
    const payload = rows.length > 0 ? rows : this.defaultChartOfAccounts();
    const result  = await this.financeGlRepo.seedAccounts(payload);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { inserted: (result.data as Record<string, unknown>[]).length };
  
    });}

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
