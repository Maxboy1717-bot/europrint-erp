import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { saasTenants } from '@shared/db/europrint-compat';
import { eq } from 'drizzle-orm';

type TenantInsert = { name: string; domain?: string; plan: string; employeeLimit: number };
type TenantUpdate = Partial<TenantInsert> & { updatedAt: Date };

@Injectable()
export class SaasRepo {
  async findAll() {
    return db.select().from(saasTenants).orderBy(saasTenants.createdAt);
  }

  async findById(id: string) {
    const rows = await db.select().from(saasTenants).where(eq(saasTenants.id, id));
    return rows[0] ?? null;
  }

  async insert(data: TenantInsert) {
    return db.insert(saasTenants).values({
      name:          data.name,
      domain:        data.domain ?? null,
      plan:          data.plan,
      employeeLimit: data.employeeLimit,
    }).returning();
  }

  async updateStatus(id: string, status: string) {
    return db.update(saasTenants).set({
      status,
      updatedAt: _time.now(),
    }).where(eq(saasTenants.id, id)).returning();
  }

  async update(id: string, data: TenantUpdate) {
    return db.update(saasTenants).set({
      name:          data.name,
      domain:        data.domain,
      plan:          data.plan,
      employeeLimit: data.employeeLimit,
      updatedAt:     data.updatedAt,
    }).where(eq(saasTenants.id, id)).returning();
  }

  async delete(id: string) {
    return db.delete(saasTenants).where(eq(saasTenants.id, id)).returning();
  }
}
