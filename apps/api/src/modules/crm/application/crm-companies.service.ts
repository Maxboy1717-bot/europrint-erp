/**
 * @module crm-companies.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CRM_COMPANIES_REPO, type ICrmCompaniesRepo } from '../domain/repositories/i-crm-companies.repo';

@Injectable()
export class CrmCompaniesService {
  constructor(@Inject(CRM_COMPANIES_REPO) private readonly repo: ICrmCompaniesRepo) {}

  async listCompanies(search: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listCompanies(search ? `%${search}%` : null, lim, off);
  }

  async getCompany(cid: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.getCompany(cid);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Kompaniya #${cid} topilmadi`);

      return rowResult.data;
    });
  }

  async getCompanyContacts(cid: number) {
    return this.repo.getCompanyContacts(cid);
  }

  async getCompanyDeals(cid: number) {
    return this.repo.getCompanyDeals(cid);
  }

  async getCompanyCredit(cid: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.getCompanyCredit(cid);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Kompaniya #${cid} topilmadi`);

      return rowResult.data;
    });
  }

  async checkDuplicates(name?: string, inn?: string) {
    return this.repo.checkDuplicates(name, inn);
  }

  async createCompany(body: Record<string, unknown>) {
    return this.repo.createCompany(body);
  }

  async updateCompany(cid: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const rowResult = await this.repo.updateCompany(cid, body);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Kompaniya #${cid} topilmadi`);

      return rowResult.data;
    });
  }

  async updateCreditLimit(cid: number, credit_limit: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.updateCreditLimit(cid, credit_limit);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Kompaniya #${cid} topilmadi`);

      return rowResult.data;
    });
  }

  async listLeadStages() {
    return this.repo.listLeadStages();
  }

  async getLeadStage(sid: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.getLeadStage(sid);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Lead stage #${sid} topilmadi`);

      return rowResult.data;
    });
  }

  async createLeadStage(name: string, color?: string, sort_order?: number) {
    return this.repo.createLeadStage(name, color, sort_order);
  }

  async updateLeadStage(sid: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const rowResult = await this.repo.updateLeadStage(sid, body);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Lead stage #${sid} topilmadi`);

      return rowResult.data;
    });
  }

  async deleteCompany(cid: number) {
    return this.repo.deleteCompany(cid);
  }

  async createCompanyContact(companyId: number, body: Record<string, unknown>) {
    return this.repo.createCompanyContact(companyId, body);
  }

  async deleteCompanyContact(companyId: number, contactId: number): Promise<void> {
    return this.repo.deleteCompanyContact(companyId, contactId);
  }
}
