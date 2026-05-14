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

type TenantInsert = { name: string; domain?: string; plan: string; employeeLimit: number };
type TenantUpdate = Partial<TenantInsert> & { updatedAt: Date };

@Injectable()
export class SaasRepo {
  async findAll() {
    try {
      return await db.select().from(saasTenants).orderBy(saasTenants.createdAt);
    } catch (e) {
      throw new Error(`saas.findAll: ${String(e)}`);
    }
  }

  async findById(id: string) {
    try {
      const rows = await db.select().from(saasTenants).where(eq(saasTenants.id, id));
      return rows[0] ?? null;
    } catch (e) {
      throw new Error(`saas.findById: ${String(e)}`);
    }
  }

  async insert(data: TenantInsert) {
    try {
      return await db.insert(saasTenants).values({
        name:          data.name,
        domain:        data.domain ?? null,
        plan:          data.plan,
        employeeLimit: data.employeeLimit,
      }).returning();
    } catch (e) {
      throw new Error(`saas.insert: ${String(e)}`);
    }
  }

  async updateStatus(id: string, status: string) {
    try {
      return await db.update(saasTenants).set({
        status,
        updatedAt: _time.now(),
      }).where(eq(saasTenants.id, id)).returning();
    } catch (e) {
      throw new Error(`saas.updateStatus: ${String(e)}`);
    }
  }

  async update(id: string, data: TenantUpdate) {
    try {
      return await db.update(saasTenants).set({
        name:          data.name,
        domain:        data.domain,
        plan:          data.plan,
        employeeLimit: data.employeeLimit,
        updatedAt:     data.updatedAt,
      }).where(eq(saasTenants.id, id)).returning();
    } catch (e) {
      throw new Error(`saas.update: ${String(e)}`);
    }
  }

  async delete(id: string) {
    try {
      return await db.delete(saasTenants).where(eq(saasTenants.id, id)).returning();
    } catch (e) {
      throw new Error(`saas.delete: ${String(e)}`);
    }
  }
}
