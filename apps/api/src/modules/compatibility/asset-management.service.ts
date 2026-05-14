/**
 * @module asset-management.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { AssetManagementRepo } from './repositories/asset-management.repo';

type AssetRow = Awaited<ReturnType<AssetManagementRepo['findAllAssets']>>[number];
type MaintenanceRow = Awaited<ReturnType<AssetManagementRepo['findAllMaintenance']>>[number];
type DisposalRow = Awaited<ReturnType<AssetManagementRepo['findAllDisposals']>>[number];
type TransferRow = Awaited<ReturnType<AssetManagementRepo['findAllTransfers']>>[number];

@Injectable()
export class AssetManagementService {
  constructor(private readonly repo: AssetManagementRepo) {}

  async getAssets(status?: string, category?: string): Promise<Result<AssetRow[]>> {
    const result = await safeCall(() => this.repo.findAllAssets());
    if (!result.ok) return Err(result.error);
    return Ok((Array.isArray(result.data) ? result.data : []).filter((r) => (!status || r.status === status) && (!category || r.category === category)));
  }

  async createAsset(body: { name: string; assetCode?: string; category: string; status: string; location?: string; assignedTo?: string; departmentId?: number; serialNumber?: string; purchaseDate?: string; purchaseValue?: string; currentValue?: string; notes?: string }): Promise<Result<AssetRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.insertAsset({
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
      }),
    );
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async getAssetById(id: string): Promise<Result<AssetRow | null>> {
    const result = await safeCall(() => this.repo.findAssetById(id));
    if (!result.ok) return Err(result.error);
    if (!result.data) return Err({ code: 'NOT_FOUND', message: `Asset ${id} not found` });
    return result;
  }

  async updateAsset(id: string, body: Partial<{ name: string; assetCode?: string; category: string; status: string; location?: string; assignedTo?: string; departmentId?: number; serialNumber?: string; purchaseDate?: string; purchaseValue?: string; currentValue?: string; notes?: string }>): Promise<Result<AssetRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.updateAsset(id, {
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
      }),
    );
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Asset ${id} not found` });
    return Ok(result.data[0]);
  }

  async deleteAsset(id: string): Promise<Result<{ deleted: true; id: string }>> {
    const result = await safeCall(() => this.repo.deleteAsset(id));
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Asset ${id} not found` });
    return Ok({ deleted: true, id });
  }

  async getSummary(): Promise<Result<{ total: number; byStatus: Record<string, number>; byCategory: Record<string, number>; updatedAt: string }>> {
    const result = await safeCall(() => this.repo.findAllAssets());
    if (!result.ok) return Err(result.error);
    const byStatus: Record<string, number>   = {};
    const byCategory: Record<string, number> = {};
    for (const a of result.data) {
      byStatus[a.status]     = (byStatus[a.status] ?? 0) + 1;
      byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
    }
    return Ok({ total: result.data.length, byStatus, byCategory, updatedAt: _time.now().toISOString() });
  }

  async getMaintenance(assetId?: string): Promise<Result<MaintenanceRow[]>> {
    return safeCall(() => assetId ? this.repo.findMaintenanceByAsset(assetId) : this.repo.findAllMaintenance());
  }

  async createMaintenance(body: { assetId: string; maintenanceType: string; scheduledAt?: string; completedAt?: string; cost?: string; notes?: string; status: string }): Promise<Result<MaintenanceRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.insertMaintenance({
        assetId:         body.assetId,
        maintenanceType: body.maintenanceType,
        scheduledAt:     body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        completedAt:     body.completedAt ? new Date(body.completedAt) : undefined,
        cost:            body.cost,
        notes:           body.notes,
        status:          body.status,
      }),
    );
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async getDisposals(): Promise<Result<DisposalRow[]>> {
    return safeCall(() => this.repo.findAllDisposals());
  }

  async createDisposal(body: { assetId: string; disposalType: string; disposalDate?: string; saleValue?: string; reason?: string; approvedBy?: string }): Promise<Result<DisposalRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.insertDisposal({
        assetId:      body.assetId,
        disposalType: body.disposalType,
        disposalDate: body.disposalDate ? new Date(body.disposalDate) : undefined,
        saleValue:    body.saleValue,
        reason:       body.reason,
        approvedBy:   body.approvedBy,
      }),
    );
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async getInsurance(query: Record<string, string>): Promise<Result<AssetRow[]>> {
    const result = await safeCall(() => this.repo.findAllAssets());
    if (!result.ok) return Err(result.error);
    const items = Array.isArray(result.data)
      ? (Array.isArray(result.data) ? result.data : []).filter((r) => r.category === 'insurance' || r.notes?.toString().toLowerCase().includes('insur'))
      : [];
    return Ok(items as AssetRow[]);
  }

  async getInsuranceExpiringSoon(query: Record<string, string>): Promise<Result<AssetRow[]>> {
    const result = await safeCall(() => this.repo.findAllAssets());
    if (!result.ok) return Err(result.error);
    const now = _time.now();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const items = Array.isArray(result.data)
      ? (Array.isArray(result.data) ? result.data : []).filter((r) => {
          if (r.category !== 'insurance') return false;
          const expiry = r.purchaseDate instanceof Date ? r.purchaseDate
            : r.purchaseDate ? new Date(String(r.purchaseDate)) : null;
          return expiry && expiry > now && expiry <= soon;
        })
      : [];
    return Ok(items as AssetRow[]);
  }

  async getTransfers(): Promise<Result<TransferRow[]>> {
    return safeCall(() => this.repo.findAllTransfers());
  }

  async createTransfer(body: { assetId: string; fromDeptId?: number; toDeptId?: number; transferDate?: string; reason?: string; approvedBy?: string }): Promise<Result<TransferRow | undefined>> {
    const result = await safeCall(() =>
      this.repo.insertTransfer({
        assetId:      body.assetId,
        fromDeptId:   body.fromDeptId,
        toDeptId:     body.toDeptId,
        transferDate: body.transferDate ? new Date(body.transferDate) : undefined,
        reason:       body.reason,
        approvedBy:   body.approvedBy,
      }),
    );
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }
}
