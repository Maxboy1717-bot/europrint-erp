/**
 * @module asset-management.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { assetItems, assetMaintenance, assetDisposals, assetTransfers } from '@shared/db/europrint-compat';
import { eq, desc } from 'drizzle-orm';
import { Ok, Err, safeCall, AppErr } from '@common/result';

type AssetInsert = {
  name: string; assetCode?: string; category: string; status: string;
  location?: string; assignedTo?: string; departmentId?: number;
  serialNumber?: string; purchaseDate?: Date; purchaseValue?: string;
  currentValue?: string; notes?: string;
};

type AssetUpdate = Partial<AssetInsert> & { updatedAt: Date };

type MaintenanceInsert = {
  assetId: string; maintenanceType: string; scheduledAt?: Date;
  completedAt?: Date; cost?: string; notes?: string; status: string;
};

type DisposalInsert = {
  assetId: string; disposalType: string; disposalDate?: Date;
  saleValue?: string; reason?: string; approvedBy?: string;
};

type TransferInsert = {
  assetId: string; fromDeptId?: number; toDeptId?: number;
  transferDate?: Date; reason?: string; approvedBy?: string;
};

@Injectable()
export class AssetManagementRepo {
  findAllAssets() {
    return safeCall(() => db.select().from(assetItems).orderBy(desc(assetItems.createdAt)), 'DB_ERROR');
  }

  async findAssetById(id: string) {
    const r = await safeCall(() => db.select().from(assetItems).where(eq(assetItems.id, id)), 'DB_ERROR');
    if (!r.ok) return Err(r.error);
    const row = r.data[0];
    if (!row) return Err(AppErr('NOT_FOUND', `Asset ${id} not found`));
    return Ok(row);
  }

  insertAsset(data: AssetInsert) {
    return safeCall(() => db.insert(assetItems).values({
      name:          data.name,
      assetCode:     data.assetCode ?? null,
      category:      data.category,
      status:        data.status,
      location:      data.location ?? null,
      assignedTo:    data.assignedTo ?? null,
      departmentId:  data.departmentId ?? null,
      serialNumber:  data.serialNumber ?? null,
      purchaseDate:  data.purchaseDate ?? null,
      purchaseValue: data.purchaseValue ?? null,
      currentValue:  data.currentValue ?? null,
      notes:         data.notes ?? null,
    }).returning(), 'DB_ERROR');
  }

  updateAsset(id: string, data: AssetUpdate) {
    return safeCall(() => db.update(assetItems).set({
      name:          data.name,
      assetCode:     data.assetCode,
      category:      data.category,
      status:        data.status,
      location:      data.location,
      assignedTo:    data.assignedTo,
      departmentId:  data.departmentId,
      serialNumber:  data.serialNumber,
      purchaseDate:  data.purchaseDate,
      purchaseValue: data.purchaseValue,
      currentValue:  data.currentValue,
      notes:         data.notes,
      updatedAt:     data.updatedAt,
    }).where(eq(assetItems.id, id)).returning(), 'DB_ERROR');
  }

  deleteAsset(id: string) {
    return safeCall(() => db.delete(assetItems).where(eq(assetItems.id, id)).returning(), 'DB_ERROR');
  }

  findAllMaintenance() {
    return safeCall(() => db.select().from(assetMaintenance).orderBy(desc(assetMaintenance.createdAt)), 'DB_ERROR');
  }

  async findMaintenanceByAsset(assetId: string) {
    const r = await safeCall(() => db.select().from(assetMaintenance).orderBy(desc(assetMaintenance.createdAt)), 'DB_ERROR');
    if (!r.ok) return Err(r.error);
    const rows = Array.isArray(r.data) ? r.data : [];
    return Ok(rows.filter((row) => row.assetId === assetId));
  }

  insertMaintenance(data: MaintenanceInsert) {
    return safeCall(() => db.insert(assetMaintenance).values({
      assetId:         data.assetId,
      maintenanceType: data.maintenanceType,
      scheduledAt:     data.scheduledAt ?? null,
      completedAt:     data.completedAt ?? null,
      cost:            data.cost ?? null,
      notes:           data.notes ?? null,
      status:          data.status,
    }).returning(), 'DB_ERROR');
  }

  findAllDisposals() {
    return safeCall(() => db.select().from(assetDisposals).orderBy(desc(assetDisposals.createdAt)), 'DB_ERROR');
  }

  insertDisposal(data: DisposalInsert) {
    return safeCall(() => db.insert(assetDisposals).values({
      assetId:      data.assetId,
      disposalType: data.disposalType,
      disposalDate: data.disposalDate ?? null,
      saleValue:    data.saleValue ?? null,
      reason:       data.reason ?? null,
      approvedBy:   data.approvedBy ?? null,
    }).returning(), 'DB_ERROR');
  }

  findAllTransfers() {
    return safeCall(() => db.select().from(assetTransfers).orderBy(desc(assetTransfers.createdAt)), 'DB_ERROR');
  }

  insertTransfer(data: TransferInsert) {
    return safeCall(() => db.insert(assetTransfers).values({
      assetId:      data.assetId,
      fromDeptId:   data.fromDeptId ?? null,
      toDeptId:     data.toDeptId ?? null,
      transferDate: data.transferDate ?? null,
      reason:       data.reason ?? null,
      approvedBy:   data.approvedBy ?? null,
    }).returning(), 'DB_ERROR');
  }
}
