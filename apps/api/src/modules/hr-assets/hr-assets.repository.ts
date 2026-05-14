/**
 * @module hr-assets.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result } from '@common/result';
import {
  queryAllAssets, queryAssetById, execCreateAsset, execUpdateAsset, execRemoveAsset,
  queryAssetsByEmployee, execAssignAsset, execReturnAsset, execReportAssetIssue,
} from '@common/database/queries-hr-assets';

type Row = Record<string, unknown>;

export interface HrAsset {
  id: string; serial_number: string | null; name: string; category: string; status: string;
  purchase_date: string | null; value: number; department_id: string | null; notes: string | null;
  created_at: string; assigned_to: string | null; assigned_employee_name: string | null; assigned_date: string | null;
}

export interface AssetFilter {
  search?: string; category?: string; status?: string; department_id?: string;
}

const toAsset = (row: Row): HrAsset => ({
  id: String(row.id ?? ''), serial_number: row.serial_number ? String(row.serial_number) : null,
  name: String(row.name ?? ''), category: String(row.category ?? 'other'),
  status: String(row.status ?? 'available'), purchase_date: row.purchase_date ? String(row.purchase_date) : null,
  value: Number(row.value ?? 0), department_id: row.department_id ? String(row.department_id) : null,
  notes: row.notes ? String(row.notes) : null, created_at: String(row.created_at ?? ''),
  assigned_to: row.assigned_to ? String(row.assigned_to) : null,
  assigned_employee_name: row.assigned_employee_name ? String(row.assigned_employee_name) : null,
  assigned_date: row.assigned_date ? String(row.assigned_date) : null,
});

@Injectable()
export class HrAssetsRepository {
  async findAll(filter: AssetFilter): Promise<Result<HrAsset[]>> {
    
    return safeCall(async () => {
      const search = filter.search ? '%' + filter.search + '%' : null;
      const rows = await queryAllAssets(search, filter.category ?? null, filter.status ?? null, filter.department_id ?? null);
      return (Array.isArray(rows) ? rows : []).map(toAsset);
    }, 'DB_ERROR');
  }

  async findById(id: string): Promise<Result<HrAsset | null>> {
    
    return safeCall(async () => {
      const row = await queryAssetById(id);
      return row ? { ...toAsset(row), history: row.history ?? [] } as HrAsset : null;
    }, 'DB_ERROR');
  }

  async create(data: { name: string; serial_number?: string; category: string; status: string; purchase_date?: string | null; value?: number; notes?: string }): Promise<Result<{ id: string }>> {
    
    return safeCall(async () => {
      return execCreateAsset(data);
    }, 'DB_ERROR');
  }

  async update(id: string, data: Partial<{ name: string; serial_number: string; category: string; status: string; purchase_date: string | null; value: number; notes: string }>): Promise<Result<void>> {
    
    return safeCall(async () => {
      await execUpdateAsset(id, data);
    }, 'DB_ERROR');
  }

  async remove(id: string): Promise<Result<void>> {
    
    return safeCall(async () => {
      await execRemoveAsset(id);
    }, 'DB_ERROR');
  }

  async findByEmployee(employeeId: string): Promise<Result<HrAsset[]>> {
    
    return safeCall(async () => {
      const rows = await queryAssetsByEmployee(employeeId);
      return (Array.isArray(rows) ? rows : []).map(toAsset);
    }, 'DB_ERROR');
  }

  async assign(assetId: string, data: { employee_id: string; assigned_date: string; condition_on_assign: string; notes?: string }): Promise<Result<void>> {
    
    return safeCall(async () => {
      await execAssignAsset(assetId, data);
    }, 'DB_ERROR');
  }

  async returnAsset(assetId: string, data: { return_date: string; condition_on_return: string; notes?: string }): Promise<Result<void>> {
    
    return safeCall(async () => {
      await execReturnAsset(assetId, data);
    }, 'DB_ERROR');
  }

  async reportIssue(assetId: string, data: { report_type: string; description: string }): Promise<Result<void>> {
    
    return safeCall(async () => {
      await execReportAssetIssue(assetId, data);
    }, 'DB_ERROR');
  }
}
