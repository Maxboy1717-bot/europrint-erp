/**
 * @module asset-management.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { assetItems, assetMaintenance, assetDisposals, assetTransfers } from '@shared/db/europrint-compat';
import { eq, desc, sql } from 'drizzle-orm';
import { Ok, Err, safeCall, AppErr } from '@common/result';
import { MONTHS_PER_YEAR } from '@common/constants/business.constants';

type Row = Record<string, unknown>;

// asset_insurance is not in the Drizzle compat barrel, so it uses parametrized raw SQL (Qoida B).
type InsuranceInsert = {
  assetId: number; policyNumber?: string; insurerName: string; coverageType?: string;
  startDate?: string; endDate?: string; premiumAmount?: number; coverageAmount?: number;
  contactInfo?: string; notes?: string;
};

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

  findInsurance() {
    return safeCall(async () => (await runQuery<Row>(sql`
      SELECT id, asset_id, policy_number, insurer_name, coverage_type, start_date, end_date,
             premium_amount, coverage_amount, status, contact_info, notes, created_at
      FROM asset_insurance ORDER BY created_at DESC
    `)).rows, 'DB_ERROR');
  }

  findExpiringInsurance() {
    return safeCall(async () => (await runQuery<Row>(sql`
      SELECT id, asset_id, policy_number, insurer_name, coverage_type, start_date, end_date,
             premium_amount, coverage_amount, status, contact_info, notes, created_at
      FROM asset_insurance
      WHERE status = 'active' AND end_date IS NOT NULL AND end_date <> ''
        AND end_date >= CURRENT_DATE::text AND end_date <= (CURRENT_DATE + INTERVAL '30 days')::date::text
      ORDER BY end_date ASC
    `)).rows, 'DB_ERROR');
  }

  insertInsurance(data: InsuranceInsert) {
    return safeCall(async () => (await runQuery<Row>(sql`
      INSERT INTO asset_insurance (asset_id, policy_number, insurer_name, coverage_type,
        start_date, end_date, premium_amount, coverage_amount, status, contact_info, notes)
      VALUES (
        ${data.assetId},
        COALESCE(${data.policyNumber ?? null}, 'POL-' || to_char(NOW(), 'YYYYMMDDHH24MISS')),
        ${data.insurerName},
        ${data.coverageType ?? 'comprehensive'},
        COALESCE(${data.startDate ?? null}, CURRENT_DATE::text),
        COALESCE(${data.endDate ?? null}, (CURRENT_DATE + INTERVAL '1 year')::date::text),
        ${data.premiumAmount ?? 0},
        ${data.coverageAmount ?? 0},
        'active',
        ${data.contactInfo ?? null},
        ${data.notes ?? null}
      )
      RETURNING *
    `)).rows, 'DB_ERROR');
  }

  /**
   * Straight-line one-month depreciation (Stage 1.4 — was a fake echo).
   * monthly = (purchase_value − salvage_value) / (useful_life_years × MONTHS_PER_YEAR);
   * a missing/zero useful_life yields 0 (no depreciation). current_value is floored at
   * salvage_value and accumulated_depreciation is capped at the depreciable base so an
   * asset can never over-depreciate. salvage_value/useful_life/accumulated_depreciation
   * are not in the Drizzle compat barrel → parametrized raw SQL (Qoida B).
   */
  depreciateAsset(id: number) {
    return safeCall(async () => (await runQuery<Row>(sql`
      UPDATE asset_items a SET
        accumulated_depreciation = LEAST(
          COALESCE(a.accumulated_depreciation, 0) + COALESCE(d.monthly, 0),
          GREATEST(COALESCE(a.purchase_value, 0) - COALESCE(a.salvage_value, 0), 0)
        ),
        current_value = GREATEST(
          COALESCE(a.salvage_value, 0),
          COALESCE(a.current_value, a.purchase_value, 0) - COALESCE(d.monthly, 0)
        )
      FROM (
        SELECT GREATEST(COALESCE(purchase_value, 0) - COALESCE(salvage_value, 0), 0)
               / (NULLIF(COALESCE(useful_life, 0), 0) * ${MONTHS_PER_YEAR}::numeric) AS monthly
        FROM asset_items WHERE id = ${id}
      ) d
      WHERE a.id = ${id}
      RETURNING a.id,
                a.current_value::float8            AS "currentValue",
                a.accumulated_depreciation::float8 AS "accumulatedDepreciation",
                COALESCE(d.monthly, 0)::float8     AS "monthlyDepreciation"
    `)).rows, 'DB_ERROR');
  }

  /** Mark a maintenance record completed (Stage 1.4 — was a fake echo). */
  completeMaintenance(id: string, cost: string | null) {
    return safeCall(async () => (await runQuery<Row>(sql`
      UPDATE asset_maintenance
      SET status = 'completed', completed_at = NOW(), cost = COALESCE(${cost}, cost)
      WHERE id = ${id}::uuid
      RETURNING *
    `)).rows, 'DB_ERROR');
  }
}
