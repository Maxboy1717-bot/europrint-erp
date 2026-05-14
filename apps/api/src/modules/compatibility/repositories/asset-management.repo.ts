/**
 * @module asset-management.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

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
    try {
      return await db.select().from(assetItems).orderBy(desc(assetItems.createdAt));
    } catch (e) {
      throw new Error(`asset_management.findAllAssets: ${String(e)}`);
    }
  }

  async findAssetById(id: string) {
    try {
      const rows = await db.select().from(assetItems).where(eq(assetItems.id, id));
      return rows[0] ?? null;
    } catch (e) {
      throw new Error(`asset_management.findAssetById: ${String(e)}`);
    }
  }

  async insertAsset(data: AssetInsert) {
    try {
      return await db.insert(assetItems).values({
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
    } catch (e) {
      throw new Error(`asset_management.insertAsset: ${String(e)}`);
    }
  }

  async updateAsset(id: string, data: AssetUpdate) {
    try {
      return await db.update(assetItems).set({
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
    } catch (e) {
      throw new Error(`asset_management.updateAsset: ${String(e)}`);
    }
  }

  async deleteAsset(id: string) {
    try {
      return await db.delete(assetItems).where(eq(assetItems.id, id)).returning();
    } catch (e) {
      throw new Error(`asset_management.deleteAsset: ${String(e)}`);
    }
  }

  async findAllMaintenance() {
    try {
      return await db.select().from(assetMaintenance).orderBy(desc(assetMaintenance.createdAt));
    } catch (e) {
      throw new Error(`asset_management.findAllMaintenance: ${String(e)}`);
    }
  }

  async findMaintenanceByAsset(assetId: string) {
    try {
      const rows = await db.select().from(assetMaintenance).orderBy(desc(assetMaintenance.createdAt));
      return (Array.isArray(rows) ? rows : []).filter((r) => r.assetId === assetId);
    } catch (e) {
      throw new Error(`asset_management.findMaintenanceByAsset: ${String(e)}`);
    }
  }

  async insertMaintenance(data: MaintenanceInsert) {
    try {
      return await db.insert(assetMaintenance).values({
        assetId:         data.assetId,
        maintenanceType: data.maintenanceType,
        scheduledAt:     data.scheduledAt ?? null,
        completedAt:     data.completedAt ?? null,
        cost:            data.cost ?? null,
        notes:           data.notes ?? null,
        status:          data.status,
      }).returning();
    } catch (e) {
      throw new Error(`asset_management.insertMaintenance: ${String(e)}`);
    }
  }

  async findAllDisposals() {
    try {
      return await db.select().from(assetDisposals).orderBy(desc(assetDisposals.createdAt));
    } catch (e) {
      throw new Error(`asset_management.findAllDisposals: ${String(e)}`);
    }
  }

  async insertDisposal(data: DisposalInsert) {
    try {
      return await db.insert(assetDisposals).values({
        assetId:      data.assetId,
        disposalType: data.disposalType,
        disposalDate: data.disposalDate ?? null,
        saleValue:    data.saleValue ?? null,
        reason:       data.reason ?? null,
        approvedBy:   data.approvedBy ?? null,
      }).returning();
    } catch (e) {
      throw new Error(`asset_management.insertDisposal: ${String(e)}`);
    }
  }

  async findAllTransfers() {
    try {
      return await db.select().from(assetTransfers).orderBy(desc(assetTransfers.createdAt));
    } catch (e) {
      throw new Error(`asset_management.findAllTransfers: ${String(e)}`);
    }
  }

  async insertTransfer(data: TransferInsert) {
    try {
      return await db.insert(assetTransfers).values({
        assetId:      data.assetId,
        fromDeptId:   data.fromDeptId ?? null,
        toDeptId:     data.toDeptId ?? null,
        transferDate: data.transferDate ?? null,
        reason:       data.reason ?? null,
        approvedBy:   data.approvedBy ?? null,
      }).returning();
    } catch (e) {
      throw new Error(`asset_management.insertTransfer: ${String(e)}`);
    }
  }
}
