/**
 * @module saas.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { SaasRepo } from './repositories/saas.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
type ResultData<R> = R extends Promise<infer T> ? (T extends { ok: true; data: infer D } ? D : never) : never;
type TenantRow = ResultData<ReturnType<SaasRepo['findAll']>> extends ReadonlyArray<infer R> ? R : never;

export interface ModuleItem { key: string; label: string; enabled: boolean }

export interface ExpiryAlert { tenantId: string; name: string; plan: string; status: string; expiresIn: number }

export interface ErrorLogRow { id: unknown; level: 'error' | 'warn' | 'info'; message: unknown; requestPath: unknown; createdAt: unknown }
interface RawErrorLogRow { id: unknown; timestamp: unknown; path: unknown; method: unknown; message: unknown; status_code: number | null; user_id: unknown }

@Injectable()
export class SaasService {
  constructor(private readonly repo: SaasRepo) {}

  getTenants(): Promise<Result<TenantRow[]>> {
    return this.repo.findAll() as Promise<Result<TenantRow[]>>;
  }

  async createTenant(body: { name: string; domain?: string; plan: string; employeeLimit: number }): Promise<Result<TenantRow | undefined>> {
    const result = await this.repo.insert({ name: body.name, domain: body.domain, plan: body.plan, employeeLimit: body.employeeLimit });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0] as TenantRow | undefined);
  }

  async getPlatformStats(): Promise<Result<{ totalTenants: number; activeTenants: number; inactiveTenants: number }>> {
    const result = await this.repo.findAll();
    if (!result.ok) return Err(result.error);
    const all = Array.isArray(result.data) ? result.data : [];
    const active = all.filter((t) => t.status === 'active').length;
    return Ok({ totalTenants: all.length, activeTenants: active, inactiveTenants: all.length - active });
  }

  // Item #121: was a hardcoded stub — the "Xatolar" admin tab always showed empty even
  // though system_error_logs has real rows (client-error beacon writes to it). level is
  // derived from status_code since the table has no level column of its own.
  async getErrorLogs(): Promise<Result<{ logs: ErrorLogRow[]; total: number }>> {
    const result = await this.repo.findErrorLogs(100);
    if (!result.ok) return Err(result.error);
    const rows = Array.isArray(result.data) ? (result.data as RawErrorLogRow[]) : [];
    const logs = rows.map((row) => ({
      id: row.id,
      level: this.deriveLevel(row.status_code),
      message: row.message,
      requestPath: row.path,
      createdAt: row.timestamp,
    }));
    return Ok({ logs, total: logs.length });
  }

  private deriveLevel(statusCode: number | null): 'error' | 'warn' | 'info' {
    if (statusCode === null || statusCode === 0 || statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  async updateTenantStatus(id: string, status: string): Promise<Result<TenantRow | undefined>> {
    const result = await this.repo.updateStatus(id, status);
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Tenant ${id} not found` });
    return Ok(result.data[0] as TenantRow | undefined);
  }

  getModules(): Promise<Result<{ modules: ModuleItem[] }>> {
    return Promise.resolve(Ok({
      modules: [
        { key: 'hr',         label: 'HR Management', enabled: true  },
        { key: 'finance',    label: 'Finance',        enabled: true  },
        { key: 'warehouse',  label: 'Warehouse',      enabled: true  },
        { key: 'crm',        label: 'CRM',            enabled: true  },
        { key: 'production', label: 'Production',     enabled: true  },
        { key: 'analytics',  label: 'Analytics',      enabled: true  },
        { key: 'ai',         label: 'AI Assistant',   enabled: false },
        { key: 'iot',        label: 'IoT Monitoring', enabled: false },
        { key: 'pos',        label: 'Point of Sale',  enabled: false },
      ],
    }));
  }

  async getTenantById(id: string): Promise<Result<TenantRow>> {
    const result = await this.repo.findById(id);
    if (!result.ok) return Err(result.error);
    return Ok(result.data as TenantRow);
  }

  async updateTenant(id: string, body: Partial<{ name: string; domain?: string; plan: string; employeeLimit: number }>): Promise<Result<TenantRow | undefined>> {
    const result = await this.repo.update(id, { ...body, updatedAt: _time.now() });
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Tenant ${id} not found` });
    return Ok(result.data[0] as TenantRow | undefined);
  }

  async deleteTenant(id: string): Promise<Result<{ deleted: true; id: string }>> {
    const result = await this.repo.delete(id);
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Tenant ${id} not found` });
    return Ok({ deleted: true, id });
  }

  async getExpiryAlerts(): Promise<Result<{ alerts: ExpiryAlert[]; total: number }>> {
    const result = await this.repo.findAll();
    if (!result.ok) return Err(result.error);
    const now = Date.now();
    const thirtyDays = 30 * MS_PER_DAY;
    const all = Array.isArray(result.data) ? result.data : [];
    const alerts: ExpiryAlert[] = all.filter((t) => t.plan === 'trial' && (now - new Date(t.createdAt).getTime()) > thirtyDays * 0.8)
      .map((t) => ({
        tenantId:  t.id,
        name:      t.name,
        plan:      t.plan,
        status:    t.status,
        expiresIn: Math.max(0, Math.round((thirtyDays - (now - new Date(t.createdAt).getTime())) / (MS_PER_DAY))),
      }));
    return Ok({ alerts, total: alerts.length });
  }

  async getTenantModules(tenantId: string): Promise<Result<{ tenantId: string; modules: unknown[] }>> {
    const r = await this.repo.findTenantModules(tenantId);
    if (!r.ok) return Err(r.error);
    return Ok({ tenantId, modules: r.data });
  }

  async updateTenantModules(tenantId: string, modules: string[]): Promise<Result<{ tenantId: string; modules: unknown[] }>> {
    const r = await this.repo.setTenantModules(tenantId, modules);
    if (!r.ok) return Err(r.error);
    return Ok({ tenantId, modules: r.data });
  }

  // Onboard = activate the tenant + enable the chosen modules (composes two real operations).
  // NOTE: admin-user creation from dto.adminEmail is deferred (needs the user-provisioning flow).
  async onboardTenant(tenantId: string, dto: { adminEmail?: string; modules?: string[] }): Promise<Result<{ tenantId: string; status: string; modules: unknown[] }>> {
    const statusR = await this.updateTenantStatus(tenantId, 'active');
    if (!statusR.ok) return Err(statusR.error);
    let modules: unknown[] = [];
    if (Array.isArray(dto.modules) && dto.modules.length > 0) {
      const modR = await this.repo.setTenantModules(tenantId, dto.modules);
      if (modR.ok) modules = modR.data;
    }
    return Ok({ tenantId, status: 'active', modules });
  }
}
