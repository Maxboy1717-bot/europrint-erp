/**
 * @module crm-contacts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CRM_CONTACTS_APP_REPO, type ICrmContactsAppRepo } from '../domain/repositories/i-crm-contacts-app.repo';

@Injectable()
export class CrmContactsService {
  constructor(@Inject(CRM_CONTACTS_APP_REPO) private readonly repo: ICrmContactsAppRepo) {}

  async listContacts(search: string | undefined, companyId: number | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listContacts(search, companyId, lim, off);
  }

  async getContact(cid: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.findById(cid);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Kontakt #${cid} topilmadi`);

      return rowResult.data;
    });
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

  async updateContact(cid: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const rowResult = await this.repo.update(
        cid, body['first_name'], body['last_name'], body['email'],
        body['phone'], body['company_id'], body['position'], body['notes'],
      );

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Kontakt #${cid} topilmadi`);

      return rowResult.data;
    });
  }

  async deleteContact(cid: number) {
    return this.repo.remove(cid);
  }
}
