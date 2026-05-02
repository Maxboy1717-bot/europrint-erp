import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { assetItems, assetMaintenance, assetDisposals, assetTransfers } from '@shared/db/europrint-compat';
import { eq, desc } from 'drizzle-orm';

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
  async findAllAssets() {
    return db.select().from(assetItems).orderBy(desc(assetItems.createdAt));
  }

  async findAssetById(id: string) {
    const rows = await db.select().from(assetItems).where(eq(assetItems.id, id));
    return rows[0] ?? null;
  }

  async insertAsset(data: AssetInsert) {
    return db.insert(assetItems).values({
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
    }).returning();
  }

  async updateAsset(id: string, data: AssetUpdate) {
    return db.update(assetItems).set({
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
    }).where(eq(assetItems.id, id)).returning();
  }

  async deleteAsset(id: string) {
    return db.delete(assetItems).where(eq(assetItems.id, id)).returning();
  }

  async findAllMaintenance() {
    return db.select().from(assetMaintenance).orderBy(desc(assetMaintenance.createdAt));
  }

  async findMaintenanceByAsset(assetId: string) {
    const rows = await db.select().from(assetMaintenance).orderBy(desc(assetMaintenance.createdAt));
    return (rows ?? []).filter((r) => r.assetId === assetId);
  }

  async insertMaintenance(data: MaintenanceInsert) {
    return db.insert(assetMaintenance).values({
      assetId:         data.assetId,
      maintenanceType: data.maintenanceType,
      scheduledAt:     data.scheduledAt ?? null,
      completedAt:     data.completedAt ?? null,
      cost:            data.cost ?? null,
      notes:           data.notes ?? null,
      status:          data.status,
    }).returning();
  }

  async findAllDisposals() {
    return db.select().from(assetDisposals).orderBy(desc(assetDisposals.createdAt));
  }

  async insertDisposal(data: DisposalInsert) {
    return db.insert(assetDisposals).values({
      assetId:      data.assetId,
      disposalType: data.disposalType,
      disposalDate: data.disposalDate ?? null,
      saleValue:    data.saleValue ?? null,
      reason:       data.reason ?? null,
      approvedBy:   data.approvedBy ?? null,
    }).returning();
  }

  async findAllTransfers() {
    return db.select().from(assetTransfers).orderBy(desc(assetTransfers.createdAt));
  }

  async insertTransfer(data: TransferInsert) {
    return db.insert(assetTransfers).values({
      assetId:      data.assetId,
      fromDeptId:   data.fromDeptId ?? null,
      toDeptId:     data.toDeptId ?? null,
      transferDate: data.transferDate ?? null,
      reason:       data.reason ?? null,
      approvedBy:   data.approvedBy ?? null,
    }).returning();
  }
}
