/**
 * @module saas.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { saasTenants } from '@shared/db/europrint-compat';
import { eq } from 'drizzle-orm';
import { Ok, Err, safeCall, AppErr } from '@common/result';

type TenantInsert = { name: string; domain?: string; plan: string; employeeLimit: number };
type TenantUpdate = Partial<TenantInsert> & { updatedAt: Date };

@Injectable()
export class SaasRepo {
  findAll() {
    return safeCall(() => db.select().from(saasTenants).orderBy(saasTenants.createdAt), 'DB_ERROR');
  }

  async findById(id: string) {
    const r = await safeCall(() => db.select().from(saasTenants).where(eq(saasTenants.id, id)), 'DB_ERROR');
    if (!r.ok) return Err(r.error);
    const row = r.data[0];
    if (!row) return Err(AppErr('NOT_FOUND', `Tenant ${id} not found`));
    return Ok(row);
  }

  insert(data: TenantInsert) {
    return safeCall(() => db.insert(saasTenants).values({
      name:          data.name,
      domain:        data.domain ?? null,
      plan:          data.plan,
      employeeLimit: data.employeeLimit,
    }).returning(), 'DB_ERROR');
  }

  updateStatus(id: string, status: string) {
    return safeCall(() => db.update(saasTenants).set({
      status,
      updatedAt: _time.now(),
    }).where(eq(saasTenants.id, id)).returning(), 'DB_ERROR');
  }

  update(id: string, data: TenantUpdate) {
    return safeCall(() => db.update(saasTenants).set({
      name:          data.name,
      domain:        data.domain,
      plan:          data.plan,
      employeeLimit: data.employeeLimit,
      updatedAt:     data.updatedAt,
    }).where(eq(saasTenants.id, id)).returning(), 'DB_ERROR');
  }

  delete(id: string) {
    return safeCall(() => db.delete(saasTenants).where(eq(saasTenants.id, id)).returning(), 'DB_ERROR');
  }
}
