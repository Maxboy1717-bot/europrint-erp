/**
 * @module saas.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { saasTenants } from '@shared/db/europrint-compat';
import { eq, sql } from 'drizzle-orm';
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

  // saas_tenant_modules is not a Drizzle import here — raw SQL. tenant_id is varchar.
  findTenantModules(tenantId: string) {
    return safeCall(async () => {
      const r = await db.execute(sql`SELECT id, tenant_id, module_key, is_enabled, enabled_at, config FROM saas_tenant_modules WHERE tenant_id = ${tenantId} ORDER BY module_key`);
      return ((r as { rows?: unknown[] }).rows ?? []) as unknown[];
    }, 'DB_ERROR');
  }

  // Replace-set the tenant's enabled modules (no unique constraint on tenant_id+module_key → DELETE+INSERT in a tx).
  setTenantModules(tenantId: string, modules: string[]) {
    return safeCall(async () => {
      await db.transaction(async (tx) => {
        await tx.execute(sql`DELETE FROM saas_tenant_modules WHERE tenant_id = ${tenantId}`);
        for (const key of modules) {
          await tx.execute(sql`INSERT INTO saas_tenant_modules (tenant_id, module_key, is_enabled, enabled_at) VALUES (${tenantId}, ${String(key)}, true, NOW())`);
        }
      });
      const r = await db.execute(sql`SELECT id, tenant_id, module_key, is_enabled FROM saas_tenant_modules WHERE tenant_id = ${tenantId} ORDER BY module_key`);
      return ((r as { rows?: unknown[] }).rows ?? []) as unknown[];
    }, 'DB_ERROR');
  }

  // Item #121: system_error_logs is not a Drizzle import here — raw SQL (matches
  // findTenantModules above). The client-error beacon (general-legacy-a.controller.ts)
  // writes real rows here; SaaS's own getErrorLogs() previously never read this table.
  findErrorLogs(limit: number) {
    return safeCall(async () => {
      const r = await db.execute(sql`
        SELECT id, timestamp, path, method, message, status_code, user_id
        FROM system_error_logs
        ORDER BY id DESC
        LIMIT ${limit}
      `);
      return ((r as { rows?: unknown[] }).rows ?? []) as unknown[];
    }, 'DB_ERROR');
  }
}
