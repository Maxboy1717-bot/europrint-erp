/**
 * @module asset-management.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { AssetManagementRepo } from './repositories/asset-management.repo';

type ResultData<R> = R extends Promise<infer T> ? (T extends { ok: true; data: infer D } ? D : never) : never;
type AssetRow = ResultData<ReturnType<AssetManagementRepo['findAllAssets']>> extends ReadonlyArray<infer R> ? R : never;
type MaintenanceRow = ResultData<ReturnType<AssetManagementRepo['findAllMaintenance']>> extends ReadonlyArray<infer R> ? R : never;
type DisposalRow = ResultData<ReturnType<AssetManagementRepo['findAllDisposals']>> extends ReadonlyArray<infer R> ? R : never;
type TransferRow = ResultData<ReturnType<AssetManagementRepo['findAllTransfers']>> extends ReadonlyArray<infer R> ? R : never;

@Injectable()
export class AssetManagementService {
  constructor(private readonly repo: AssetManagementRepo) {}

  async getAssets(status?: string, category?: string): Promise<Result<AssetRow[]>> {
    const result = await this.repo.findAllAssets();
    if (!result.ok) return Err(result.error);
    const all = (Array.isArray(result.data) ? result.data : []) as AssetRow[];
    return Ok(all.filter((r) => (!status || r.status === status) && (!category || r.category === category)));
  }

  async createAsset(body: { name: string; assetCode?: string; category: string; status: string; location?: string; assignedTo?: string; departmentId?: number; serialNumber?: string; purchaseDate?: string; purchaseValue?: string; currentValue?: string; notes?: string }): Promise<Result<AssetRow | undefined>> {
    const result = await this.repo.insertAsset({
      name:          body.name,
      assetCode:     body.assetCode,
      category:      body.category,
      status:        body.status,
      location:      body.location,
      assignedTo:    body.assignedTo,
      departmentId:  body.departmentId,
      serialNumber:  body.serialNumber,
      purchaseDate:  body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      purchaseValue: body.purchaseValue,
      currentValue:  body.currentValue,
      notes:         body.notes,
    });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0] as AssetRow | undefined);
  }

  async getAssetById(id: string): Promise<Result<AssetRow>> {
    const result = await this.repo.findAssetById(id);
    if (!result.ok) return Err(result.error);
    return Ok(result.data as AssetRow);
  }

  async updateAsset(id: string, body: Partial<{ name: string; assetCode?: string; category: string; status: string; location?: string; assignedTo?: string; departmentId?: number; serialNumber?: string; purchaseDate?: string; purchaseValue?: string; currentValue?: string; notes?: string }>): Promise<Result<AssetRow | undefined>> {
    const result = await this.repo.updateAsset(id, {
      name:          body.name,
      assetCode:     body.assetCode,
      category:      body.category,
      status:        body.status,
      location:      body.location,
      assignedTo:    body.assignedTo,
      departmentId:  body.departmentId,
      serialNumber:  body.serialNumber,
      purchaseDate:  body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      purchaseValue: body.purchaseValue,
      currentValue:  body.currentValue,
      notes:         body.notes,
      updatedAt:     _time.now(),
    });
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Asset ${id} not found` });
    return Ok(result.data[0] as AssetRow | undefined);
  }

  async deleteAsset(id: string): Promise<Result<{ deleted: true; id: string }>> {
    const result = await this.repo.deleteAsset(id);
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Asset ${id} not found` });
    return Ok({ deleted: true, id });
  }

  async getSummary(): Promise<Result<{ total: number; byStatus: Record<string, number>; byCategory: Record<string, number>; updatedAt: string }>> {
    const result = await this.repo.findAllAssets();
    if (!result.ok) return Err(result.error);
    const all = Array.isArray(result.data) ? result.data : [];
    const byStatus: Record<string, number>   = {};
    const byCategory: Record<string, number> = {};
    for (const a of all) {
      byStatus[a.status]     = (byStatus[a.status] ?? 0) + 1;
      byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
    }
    return Ok({ total: all.length, byStatus, byCategory, updatedAt: _time.now().toISOString() });
  }

  async getMaintenance(assetId?: string): Promise<Result<MaintenanceRow[]>> {
    const result = assetId ? await this.repo.findMaintenanceByAsset(assetId) : await this.repo.findAllMaintenance();
    if (!result.ok) return Err(result.error);
    return Ok(result.data as MaintenanceRow[]);
  }

  async createMaintenance(body: { assetId: string; maintenanceType: string; scheduledAt?: string; completedAt?: string; cost?: string; notes?: string; status: string }): Promise<Result<MaintenanceRow | undefined>> {
    const result = await this.repo.insertMaintenance({
      assetId:         body.assetId,
      maintenanceType: body.maintenanceType,
      scheduledAt:     body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      completedAt:     body.completedAt ? new Date(body.completedAt) : undefined,
      cost:            body.cost,
      notes:           body.notes,
      status:          body.status,
    });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0] as MaintenanceRow | undefined);
  }

  async getDisposals(): Promise<Result<DisposalRow[]>> {
    const result = await this.repo.findAllDisposals();
    if (!result.ok) return Err(result.error);
    return Ok(result.data as DisposalRow[]);
  }

  async createDisposal(body: { assetId: string; disposalType: string; disposalDate?: string; saleValue?: string; reason?: string; approvedBy?: string }): Promise<Result<DisposalRow | undefined>> {
    const result = await this.repo.insertDisposal({
      assetId:      body.assetId,
      disposalType: body.disposalType,
      disposalDate: body.disposalDate ? new Date(body.disposalDate) : undefined,
      saleValue:    body.saleValue,
      reason:       body.reason,
      approvedBy:   body.approvedBy,
    });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0] as DisposalRow | undefined);
  }

  async getInsurance(_query: Record<string, string>): Promise<Result<AssetRow[]>> {
    const result = await this.repo.findAllAssets();
    if (!result.ok) return Err(result.error);
    const all = Array.isArray(result.data) ? result.data : [];
    const items = all.filter((r) => r.category === 'insurance' || r.notes?.toString().toLowerCase().includes('insur'));
    return Ok(items as AssetRow[]);
  }

  async getInsuranceExpiringSoon(_query: Record<string, string>): Promise<Result<AssetRow[]>> {
    const result = await this.repo.findAllAssets();
    if (!result.ok) return Err(result.error);
    const now = _time.now();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const all = Array.isArray(result.data) ? result.data : [];
    const items = all.filter((r) => {
      if (r.category !== 'insurance') return false;
      const expiry = r.purchaseDate instanceof Date ? r.purchaseDate
        : r.purchaseDate ? new Date(String(r.purchaseDate)) : null;
      return expiry && expiry > now && expiry <= soon;
    });
    return Ok(items as AssetRow[]);
  }

  async getTransfers(): Promise<Result<TransferRow[]>> {
    const result = await this.repo.findAllTransfers();
    if (!result.ok) return Err(result.error);
    return Ok(result.data as TransferRow[]);
  }

  async createTransfer(body: { assetId: string; fromDeptId?: number; toDeptId?: number; transferDate?: string; reason?: string; approvedBy?: string }): Promise<Result<TransferRow | undefined>> {
    const result = await this.repo.insertTransfer({
      assetId:      body.assetId,
      fromDeptId:   body.fromDeptId,
      toDeptId:     body.toDeptId,
      transferDate: body.transferDate ? new Date(body.transferDate) : undefined,
      reason:       body.reason,
      approvedBy:   body.approvedBy,
    });
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0] as TransferRow | undefined);
  }
}
