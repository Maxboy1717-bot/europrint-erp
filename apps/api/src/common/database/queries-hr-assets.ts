/**
 * @module queries-hr-assets
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import { asset_items_ext, employee_assets } from '@shared/db';
import { hrEmployees } from '@shared/db';
import { eq, and, isNull, sql, or, ilike } from 'drizzle-orm';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;

export async function queryAllAssets(
  search: string | null,
  category: string | null,
  status: string | null,
  departmentId: string | null,
): Promise<Row[]> {
  const rows = await db.select({
    id:                     sql<string>`${asset_items_ext.id}::text`,
    serial_number:          asset_items_ext.serial_number,
    name:                   asset_items_ext.name,
    category:               asset_items_ext.category,
    status:                 asset_items_ext.status,
    purchase_date:          sql<string>`${asset_items_ext.purchase_date}::text`,
    value:                  sql<number>`COALESCE(${asset_items_ext.purchase_price}::numeric, 0)`,
    department_id:          sql<string>`${asset_items_ext.department_id}::text`,
    notes:                  sql<string | null>`NULL`,
    created_at:             sql<string>`${asset_items_ext.created_at}::text`,
    assigned_to:            asset_items_ext.assigned_to,
    assigned_employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
    assigned_date:          sql<string>`${employee_assets.assigned_date}::text`,
  })
    .from(asset_items_ext)
    .leftJoin(employee_assets, and(
      eq(employee_assets.asset_id, sql`${asset_items_ext.id}::text`),
      isNull(employee_assets.return_date),
    ))
    .leftJoin(hrEmployees, eq(sql`${hrEmployees.id}::text`, employee_assets.employee_id))
    .where(and(
      // Soft-deleted assets (is_active=false, set by execRemoveAsset) never appear in listings.
      or(isNull(asset_items_ext.is_active), eq(asset_items_ext.is_active, true)),
      search ? or(ilike(asset_items_ext.name, search), ilike(asset_items_ext.serial_number, search)) : sql`TRUE`,
      category ? eq(asset_items_ext.category, category) : sql`TRUE`,
      status ? eq(asset_items_ext.status, status) : sql`TRUE`,
      departmentId ? eq(sql`${asset_items_ext.department_id}::text`, departmentId) : sql`TRUE`,
    ))
    .orderBy(sql`${asset_items_ext.created_at} DESC`)
    .limit(MAX_QUERY_LIMIT);
  return rows as Row[];
}

export async function queryAssetById(id: string): Promise<Row | null> {
  const rows = await db.select({
    id:                     sql<string>`${asset_items_ext.id}::text`,
    serial_number:          asset_items_ext.serial_number,
    name:                   asset_items_ext.name,
    category:               asset_items_ext.category,
    status:                 asset_items_ext.status,
    purchase_date:          sql<string>`${asset_items_ext.purchase_date}::text`,
    value:                  sql<number>`COALESCE(${asset_items_ext.purchase_price}::numeric, 0)`,
    department_id:          sql<string>`${asset_items_ext.department_id}::text`,
    notes:                  sql<string | null>`NULL`,
    created_at:             sql<string>`${asset_items_ext.created_at}::text`,
    assigned_to:            asset_items_ext.assigned_to,
    assigned_employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
    assigned_date:          sql<string>`${employee_assets.assigned_date}::text`,
    history:                sql<Row[]>`COALESCE(
      json_agg(json_build_object(
        'id', ${employee_assets.id}::text,
        'employee_id', ${employee_assets.employee_id},
        'assigned_date', ${employee_assets.assigned_date}::text,
        'return_date', ${employee_assets.return_date}::text,
        'condition_on_assign', ${employee_assets.condition_on_assign},
        'condition_on_return', ${employee_assets.condition_on_return},
        'revision_type', 'assignment'
      )) FILTER (WHERE ${employee_assets.id} IS NOT NULL), '[]'::json)`,
  })
    .from(asset_items_ext)
    .leftJoin(employee_assets, eq(employee_assets.asset_id, sql`${asset_items_ext.id}::text`))
    .leftJoin(hrEmployees, and(
      eq(sql`${hrEmployees.id}::text`, employee_assets.employee_id),
      isNull(employee_assets.return_date),
    ))
    .where(eq(sql`${asset_items_ext.id}::text`, id))
    .groupBy(
      asset_items_ext.id, asset_items_ext.serial_number, asset_items_ext.name,
      asset_items_ext.category, asset_items_ext.status, asset_items_ext.purchase_date,
      asset_items_ext.purchase_price, asset_items_ext.department_id,
      asset_items_ext.created_at, asset_items_ext.assigned_to,
      hrEmployees.first_name, hrEmployees.last_name,
      employee_assets.assigned_date,
    )
    .limit(1);
  return (rows[0] ?? null) as Row | null;
}

export async function execCreateAsset(data: {
  name: string; serial_number?: string; category: string; status: string;
  purchase_date?: string | null; value?: number; notes?: string;
}): Promise<{ id: string }> {
  // NOTE: canonical asset_items has no `notes` column — drop the field on insert.
  const rows = await db.insert(asset_items_ext).values({
    name: data.name,
    serial_number: data.serial_number ?? null,
    category: data.category,
    status: data.status,
    purchase_date: data.purchase_date ?? null,
    purchase_price: String(data.value ?? 0),
  }).returning({ id: asset_items_ext.id });
  return { id: String(rows[0]?.id ?? '') };
}

export async function execUpdateAsset(
  id: string,
  data: Partial<{ name: string; serial_number: string; category: string; status: string; purchase_date: string | null; value: number; notes: string }>,
): Promise<void> {
  // NOTE: canonical asset_items has no `notes` column — ignore data.notes on update.
  // NOTE: asset_items is a VIEW over asset_inventory; neither has an updated_at column
  // (see schema-business-c-1.ts) — do not set it, ALTER TABLE cannot add it to the view.
  await db.update(asset_items_ext)
    .set({
      name:           sql`COALESCE(${data.name ?? null}, ${asset_items_ext.name})`,
      serial_number:  sql`COALESCE(${data.serial_number ?? null}, ${asset_items_ext.serial_number})`,
      category:       sql`COALESCE(${data.category ?? null}, ${asset_items_ext.category})`,
      status:         sql`COALESCE(${data.status ?? null}, ${asset_items_ext.status})`,
      purchase_price: sql`COALESCE(${data.value != null ? String(data.value) : null}::numeric, ${asset_items_ext.purchase_price})`,
    })
    .where(eq(sql`${asset_items_ext.id}::text`, id));
}

export async function execRemoveAsset(id: string): Promise<void> {
  // Soft-delete only (Qoida: hard DELETE taqiqlangan) — flips is_active=false instead of
  // removing the row, so assignment history (employee_assets FK to asset_id) is preserved
  // and the asset simply drops out of queryAllAssets' listing (is_active filter above).
  await db.update(asset_items_ext)
    .set({ is_active: false })
    .where(eq(sql`${asset_items_ext.id}::text`, id));
}

export async function queryAssetsByEmployee(employeeId: string): Promise<Row[]> {
  const rows = await db.select({
    id:                     sql<string>`${asset_items_ext.id}::text`,
    serial_number:          asset_items_ext.serial_number,
    name:                   asset_items_ext.name,
    category:               asset_items_ext.category,
    status:                 asset_items_ext.status,
    purchase_date:          sql<string>`${asset_items_ext.purchase_date}::text`,
    value:                  sql<number>`COALESCE(${asset_items_ext.purchase_price}::numeric, 0)`,
    department_id:          sql<string>`${asset_items_ext.department_id}::text`,
    notes:                  sql<string | null>`NULL`,
    created_at:             sql<string>`${asset_items_ext.created_at}::text`,
    assigned_to:            asset_items_ext.assigned_to,
    assigned_employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
    assigned_date:          sql<string>`${employee_assets.assigned_date}::text`,
  })
    .from(asset_items_ext)
    .innerJoin(employee_assets, and(
      eq(employee_assets.asset_id, sql`${asset_items_ext.id}::text`),
      isNull(employee_assets.return_date),
    ))
    .innerJoin(hrEmployees, eq(sql`${hrEmployees.id}::text`, employee_assets.employee_id))
    .where(eq(employee_assets.employee_id, employeeId))
    .orderBy(sql`${employee_assets.assigned_date} DESC`);
  return rows as Row[];
}

export async function execAssignAsset(
  assetId: string,
  data: { employee_id: string; assigned_date: string; condition_on_assign: string; notes?: string },
): Promise<void> {
  await db.update(asset_items_ext)
    .set({ status: 'assigned', assigned_to: Number(data.employee_id) })
    .where(eq(sql`${asset_items_ext.id}::text`, assetId));

  await db.insert(employee_assets).values({
    asset_id: assetId,
    employee_id: data.employee_id,
    assigned_date: data.assigned_date,
    condition_on_assign: data.condition_on_assign,
    notes: data.notes ?? null,
  });
}

export async function execReturnAsset(
  assetId: string,
  data: { return_date: string; condition_on_return: string; notes?: string },
): Promise<void> {
  await db.update(asset_items_ext)
    .set({ status: 'available', assigned_to: null })
    .where(eq(sql`${asset_items_ext.id}::text`, assetId));

  await db.update(employee_assets)
    .set({
      return_date: data.return_date,
      condition_on_return: data.condition_on_return,
      notes: sql`COALESCE(${data.notes ?? null}, ${employee_assets.notes})`,
    })
    .where(and(
      eq(employee_assets.asset_id, assetId),
      isNull(employee_assets.return_date),
    ));
}

export async function execReportAssetIssue(
  assetId: string,
  data: { report_type: string; description: string },
): Promise<void> {
  // NOTE: canonical asset_items has no notes column — write description to the
  // status field via raw SQL or drop it. Preserving status only here.
  await db.update(asset_items_ext)
    .set({ status: data.report_type })
    .where(eq(sql`${asset_items_ext.id}::text`, assetId));
  void data.description;
}
