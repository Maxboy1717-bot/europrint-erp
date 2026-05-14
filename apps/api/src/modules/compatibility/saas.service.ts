/**
 * @module saas.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { SaasRepo } from './repositories/saas.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
type TenantRow = Awaited<ReturnType<SaasRepo['findAll']>>[number];

export interface ModuleItem { key: string; label: string; enabled: boolean }

export interface ExpiryAlert { tenantId: string; name: string; plan: string; status: string; expiresIn: number }

@Injectable()
export class SaasService {
  constructor(private readonly repo: SaasRepo) {}

  getTenants(): Promise<Result<TenantRow[]>> {
    return safeCall(() => this.repo.findAll());
  }

  async createTenant(body: { name: string; domain?: string; plan: string; employeeLimit: number }): Promise<Result<TenantRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.insert({ name: body.name, domain: body.domain, plan: body.plan, employeeLimit: body.employeeLimit }),
    );
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async getPlatformStats(): Promise<Result<{ totalTenants: number; activeTenants: number; inactiveTenants: number }>> {
    const result = await safeCall(() => this.repo.findAll());
    if (!result.ok) return Err(result.error);
    const active = (Array.isArray(result.data) ? result.data : []).filter((t) => t.status === 'active').length;
    return Ok({ totalTenants: result.data.length, activeTenants: active, inactiveTenants: result.data.length - active });
  }

  getErrorLogs(): Promise<Result<{ logs: never[]; total: number }>> {
    return Promise.resolve(Ok({ logs: [], total: 0 }));
  }

  async updateTenantStatus(id: string, status: string): Promise<Result<TenantRow | undefined>> {
    const result = await safeCall(() => this.repo.updateStatus(id, status));
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Tenant ${id} not found` });
    return Ok(result.data[0]);
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

  async getTenantById(id: string): Promise<Result<TenantRow | null>> {
    const result = await safeCall(() => this.repo.findById(id));
    if (!result.ok) return Err(result.error);
    if (!result.data) return Err({ code: 'NOT_FOUND', message: `Tenant ${id} not found` });
    return result;
  }

  async updateTenant(id: string, body: Partial<{ name: string; domain?: string; plan: string; employeeLimit: number }>): Promise<Result<TenantRow | undefined>> {
    const result = await safeCall(() => this.repo.update(id, { ...body, updatedAt: _time.now() }));
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Tenant ${id} not found` });
    return Ok(result.data[0]);
  }

  async deleteTenant(id: string): Promise<Result<{ deleted: true; id: string }>> {
    const result = await safeCall(() => this.repo.delete(id));
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Tenant ${id} not found` });
    return Ok({ deleted: true, id });
  }

  async getExpiryAlerts(): Promise<Result<{ alerts: ExpiryAlert[]; total: number }>> {
    const result = await safeCall(() => this.repo.findAll());
    if (!result.ok) return Err(result.error);
    const now = Date.now();
    const thirtyDays = 30 * MS_PER_DAY;
    const alerts: ExpiryAlert[] = (Array.isArray(result.data) ? result.data : []).filter((t) => t.plan === 'trial' && (now - new Date(t.createdAt).getTime()) > thirtyDays * 0.8)
      .map((t) => ({
        tenantId:  t.id,
        name:      t.name,
        plan:      t.plan,
        status:    t.status,
        expiresIn: Math.max(0, Math.round((thirtyDays - (now - new Date(t.createdAt).getTime())) / (MS_PER_DAY))),
      }));
    return Ok({ alerts, total: alerts.length });
  }
}
