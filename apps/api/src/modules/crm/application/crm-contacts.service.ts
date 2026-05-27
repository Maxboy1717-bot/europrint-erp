/**
 * @module crm-contacts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError, Err, Ok } from '@common/result';
import { CRM_CONTACTS_APP_REPO, type ICrmContactsAppRepo } from '../domain/repositories/i-crm-contacts-app.repo';

@Injectable()
export class CrmContactsService {
  constructor(@Inject(CRM_CONTACTS_APP_REPO) private readonly repo: ICrmContactsAppRepo) {}

  async listContacts(search: string | undefined, companyId: number | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listContacts(search, companyId, lim, off);
  }

  async getContact(cid: number): Promise<Result<object, AppError>> {
    const rowResult = await this.repo.findById(cid);
    if (!rowResult.ok) return Err(rowResult.error);
    if (!rowResult.data) return Err({ code: 'NOT_FOUND' as const, message: `Kontakt #${cid} topilmadi` });
    return Ok(rowResult.data);
  }

  async checkDuplicates(email?: string, phone?: string) {
    return this.repo.checkDuplicates(email, phone);
  }

  async createContact(body: Record<string, unknown>) {
    return this.repo.create(
      body['first_name'], body['last_name'], body['email'],
      body['phone'], body['company_id'], body['position'], body['notes'],
    );
  }

  async updateContact(cid: number, body: Record<string, unknown>): Promise<Result<object, AppError>> {
    const rowResult = await this.repo.update(
      cid, body['first_name'], body['last_name'], body['email'],
      body['phone'], body['company_id'], body['position'], body['notes'],
    );
    if (!rowResult.ok) return Err(rowResult.error);
    if (!rowResult.data) return Err({ code: 'NOT_FOUND' as const, message: `Kontakt #${cid} topilmadi` });
    return Ok(rowResult.data);
  }

  async deleteContact(cid: number) {
    return this.repo.remove(cid);
  }
}
