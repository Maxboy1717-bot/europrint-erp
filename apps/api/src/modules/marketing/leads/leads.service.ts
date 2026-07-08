/**
 * @module leads.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError } from '@common/result';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';
import { LeadsRepository } from './leads.repository';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly repo: LeadsRepository,
    private readonly i18n: I18nService,
  ) {}

  private mapRow(r: Record<string, unknown>) {
    const parts = String(r['name'] ?? '').split(' ');
    return { ...r, firstName: parts[0] || '', lastName: parts.length > 1 ? parts.slice(1).join(' ') : '' };
  }

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rawPage  = Number(query.page);
      const rawLimit = Number(query.limit);
      const page  = Number.isFinite(rawPage)  && rawPage  > 0 ? Math.floor(rawPage)  : 1;
      const lim   = Math.min(200, Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10);
      const totalR = await this.repo.count();
      const total = totalR.ok ? totalR.data : 0;
      const rowsR = await this.repo.findAll({ limit: lim, offset: (page - 1) * lim });
      const rowsData = rowsR.ok && Array.isArray(rowsR.data) ? rowsR.data : [];
      const data = rowsData.map((r: Record<string, unknown>) => this.mapRow(r));
      return { data, total, page, limit: lim };
    });
  }

  async findOne(id: string) {
    // marketing_leads.id is varchar (slugs like "demo-lead-010") — the caller must pass the
    // raw string id (the controller previously did Number(id) -> NaN, so real leads were never
    // found). Properly unwrap the repo Result: the previous `if (!row)` tested the Result
    // wrapper (always truthy), so the 404 never fired and a missing lead returned 200 null.
    const r = await this.repo.findOne(id);
    if (!r.ok) throw new InternalServerErrorException(String(r.error));
    if (!r.data) throw new NotFoundException(await this.i18n.t('errors.marketingLeadNotFoundWithId', { args: { id } }));
    return r.data;
  }

  async create(dto: Record<string, unknown>, _createdBy?: number) {
    return safeCall(async () => {
      // vision #2 (14-marketing): normalize the phone on entry — strip spaces/dashes/parens so
      // "+998 (90) 123-45-67" is stored as "+998901234567". Lenient (Q-39): a value that isn't
      // strict E.164 is still stored in stripped form (with a warn) rather than rejected, so
      // existing lead-create flows keep working. Strict-reject would be an owner policy add.
      const rawPhone = (dto['phone'] as string | undefined) || undefined;
      let normalizedPhone = rawPhone;
      if (rawPhone) {
        const p = PhoneNumber.create(rawPhone);
        normalizedPhone = p.ok ? p.data.value : PhoneNumber.fromRaw(rawPhone).value;
        if (!p.ok) this.logger.warn(`marketing lead phone not E.164 after normalize: "${rawPhone}"`);
      }
      const row: Record<string, unknown> = {
        name: String(dto['name'] ?? dto['firstName'] ?? ''),
        company: (dto['company'] as string | undefined) || undefined,
        phone: normalizedPhone,
        email: (dto['email'] as string | undefined) || undefined,
        source: (dto['source'] as string | undefined) ?? 'website',
        channel: (dto['channel'] as string | undefined) || undefined,
        campaignId: (dto['campaignId'] as string | undefined) || undefined,
        status: (dto['status'] as string | undefined) ?? 'new',
        score: dto['score'] != null ? Number(dto['score']) : 0,
        notes: (dto['notes'] as string | undefined) || undefined,
        lostReason: (dto['lostReason'] as string | undefined) || undefined,
        firstName: (dto['firstName'] as string | undefined) || undefined,
        lastName: (dto['lastName'] as string | undefined) || undefined,
      };
      return this.repo.create(row);
    });
  }

  async update(id: string, dto: Record<string, unknown>) {
    return safeCall(async () => {
      await this.findOne(id); // now really 404s on a missing lead (no silent 0-row update)
      return this.repo.update(id, dto);
    });
  }

  async remove(id: string) {
    return safeCall(async () => {
      await this.findOne(id);
      await this.repo.softDelete(id);
      this.logger.log(`leads: o'chirildi id=${id}`);
      return { message: 'O\'chirildi' };
    });
  }

  async getLossAnalysis() {
    return this.repo.getLossAnalysis();
  }
}
