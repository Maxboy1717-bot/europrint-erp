/**
 * @module reports.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { IFinanceReportsRepository, FINANCE_REPORTS_REPO } from './i-reports.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class FinanceReportsService {
  constructor(@Inject(FINANCE_REPORTS_REPO) private readonly repo: IFinanceReportsRepository) {}

  async findTrialBalance(fiscalYear?: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.repo.findTrialBalance(fiscalYear);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findProfitLoss(from?: string, to?: string){
    return safeCall(async () => {
    const result = await this.repo.findProfitLoss(from, to);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findWeeklySummary(){
    return safeCall(async () => {
    const result = await this.repo.findWeeklySummary();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findMonthlySummary(year?: number){
    return safeCall(async () => {
    const result = await this.repo.findMonthlySummary(year);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findKpiDashboard(){
    return safeCall(async () => {
    const result = await this.repo.findKpiDashboard();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
