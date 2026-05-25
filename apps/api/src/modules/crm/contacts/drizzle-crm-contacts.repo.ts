/**
 * @module drizzle-crm-contacts.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { crmContacts, crmCompanies } from '@europrint/schemas';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ICrmContactsRepository } from './i-crm-contacts.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleCrmContactsRepository implements ICrmContactsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(crmContacts).where(isNull(crmContacts.deleted_at)).limit(1).offset(0),
        db.select().from(crmContacts).leftJoin(crmCompanies, eq(crmContacts.company_id, crmCompanies.id)).where(isNull(crmContacts.deleted_at)).orderBy(desc(crmContacts.created_at)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Kontaktlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(crmContacts).where(and(eq(crmContacts.id, id), isNull(crmContacts.deleted_at))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Kontakt #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const row = {
        first_name: (dto.firstName as string | undefined) ?? (dto.first_name as string | undefined) ?? '',
        last_name:  (dto.lastName as string | undefined) ?? (dto.last_name as string | undefined) ?? '',
        email:      dto.email as string | undefined,
        phone:      dto.phone as string | undefined,
        position:   dto.position as string | undefined,
        company_id: (dto.companyId ?? dto.company_id) as number | undefined,
        notes:      dto.notes as string | undefined,
      };
      const result = await db.insert(crmContacts).values(row as typeof crmContacts.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(crmContacts).set(dto as Partial<typeof crmContacts.$inferInsert>).where(eq(crmContacts.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(crmContacts).set({ deleted_at: _time.now() }).where(eq(crmContacts.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
