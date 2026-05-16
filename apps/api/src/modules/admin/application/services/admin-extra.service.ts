/**
 * @module admin-extra.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Result, AppError, safeCall } from '@common/result';
import { ONE_MB } from '@common/constants/app.constants';
import { AdminExtraRepository } from '../../infrastructure/repositories/admin-extra.repo';

export interface RoleDefinition {
  role: string;
  label: string;
  permissions: string[];
}

export interface SystemStatus {
  status: string;
  uptime: number;
  memoryMb: number;
  nodeVersion: string;
  alerts: unknown[];
  unreadAlertsCount: number;
}

@Injectable()
export class AdminExtraService {
  private readonly logger = new Logger(AdminExtraService.name);

  constructor(
    private readonly repo: AdminExtraRepository,
    private readonly i18n: I18nService,
  ) {}

  getRoles(): RoleDefinition[] {
    return [
      { role: 'super_admin',        label: 'Super Admin',               permissions: ['*'] },
      { role: 'director',           label: 'Direktor',                  permissions: ['read:all', 'write:strategy'] },
      { role: 'hr_manager',         label: 'HR Menejer',                permissions: ['read:hr', 'write:hr'] },
      { role: 'accountant',         label: 'Buxgalter',                 permissions: ['read:finance', 'write:finance'] },
      { role: 'warehouse_manager',  label: 'Ombor Menejer',             permissions: ['read:wms', 'write:wms'] },
      { role: 'production_manager', label: 'Ishlab Chiqarish Menejer',  permissions: ['read:production', 'write:production'] },
      { role: 'sales_manager',      label: 'Sotuv Menejer',             permissions: ['read:crm', 'write:crm'] },
      { role: 'employee',           label: 'Xodim',                     permissions: ['read:self'] },
    ];
  }

  async getLogs(page: number, limit: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findLogs(page, limit);
      if (!r.ok) { this.logger.warn('getLogs: repo error, returning empty'); return { data: [], total: 0, page, limit }; }
      return { data: r.data.rows, total: r.data.total, page, limit };
    });
  }

  async getAudit(tableName: string | undefined, page: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findAuditByTable(tableName, page);
      if (!r.ok) { this.logger.warn('getAudit: repo error, returning empty'); return { data: [], page }; }
      return { data: r.data, page };
    });
  }

  async getLogsFiltered(opts: {
    action?: string;
    tableName?: string;
    userId?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findLogsFiltered(opts);
      if (!r.ok) return { data: [], total: 0 };
      return { data: r.data.rows, total: r.data.total };
    });
  }

  async getDistinctTables(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getDistinctTables();
      return { tables: r.ok ? r.data : [] };
    });
  }

  async getSystemStatus(): Promise<Result<SystemStatus, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findAlerts();
      return {
        status:            'operational',
        uptime:            process.uptime(),
        memoryMb:          Math.round(process.memoryUsage().heapUsed / ONE_MB),
        nodeVersion:       process.version,
        alerts:            r.ok ? r.data.alerts : [],
        unreadAlertsCount: r.ok ? r.data.unreadCount : 0,
      };
    });
  }

  async getAlertById(id: number): Promise<Result<object, AppError>> {
    const notFoundMsg = await this.i18n.t('errors.notFound');
    return safeCall(async () => {
      const r = await this.repo.findAlertById(id);
      if (!r.ok || r.data === null) return { id, message: notFoundMsg };
      return r.data as object;
    });
  }
}
