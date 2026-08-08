/**
 * @module mm-dashboard.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (MM)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { SECONDS_PER_DAY, MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import type { IMmDashboardRepo } from '../../domain/repositories/i-mm-dashboard.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class MmDashboardRepository implements IMmDashboardRepo {
  async getDashboardStats(): Promise<Result<Row>>  {
  try {
      const rows = await exec(sql`SELECT (SELECT COUNT(*)::int FROM mm_purchase_orders WHERE status = 'pending') AS pending_po, (SELECT COUNT(*)::int FROM mm_purchase_orders WHERE status = 'approved') AS approved_po, (SELECT COALESCE(SUM(total_amount), 0)::numeric(15,2) FROM mm_purchase_orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS monthly_po_value, (SELECT COUNT(*)::int FROM mm_purchase_requisitions WHERE status = 'pending') AS pending_pr, (SELECT COUNT(*)::int FROM mm_vendors WHERE is_active = true) AS active_vendors, (SELECT COUNT(*)::int FROM wms_alerts WHERE is_resolved = false) AS open_alerts`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVendorRatings(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT v.id, v.name, v.email, COALESCE(AVG(vr.quality_score), 0)::numeric(4,2) AS avg_quality, COALESCE(AVG(vr.delivery_score), 0)::numeric(4,2) AS avg_delivery, COALESCE(AVG(vr.price_score), 0)::numeric(4,2) AS avg_price, COUNT(vr.id)::int AS rating_count, MAX(vr.rated_at) AS last_rated FROM mm_vendors v LEFT JOIN mm_vendor_ratings vr ON vr.vendor_id = v.id WHERE v.is_active = true GROUP BY v.id, v.name, v.email ORDER BY avg_quality DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMrpResults(materialId?: number): Promise<Result<Row[]>>  {
  try {
      return materialId
        ? exec(sql`SELECT mr.*, m.name AS material_name, m.unit_of_measure FROM mm_mrp_results mr JOIN mm_materials m ON m.id = mr.material_id WHERE mr.material_id = ${materialId} ORDER BY mr.calculated_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT mr.*, m.name AS material_name, m.unit_of_measure FROM mm_mrp_results mr JOIN mm_materials m ON m.id = mr.material_id ORDER BY mr.calculated_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async runMrp(): Promise<Result<number>>  {
  try {
      const r = await exec(sql`INSERT INTO mm_mrp_results (material_id, required_qty, available_qty, shortage_qty, suggested_order_qty, calculated_at) SELECT sl.material_id, COALESCE(dr.required_qty, sl.min_stock) AS required_qty, sl.quantity_on_hand AS available_qty, GREATEST(0, COALESCE(dr.required_qty, sl.min_stock) - sl.quantity_on_hand) AS shortage_qty, GREATEST(0, sl.max_stock - sl.quantity_on_hand) AS suggested_order_qty, NOW() FROM wms_stock_levels sl LEFT JOIN (SELECT material_id, SUM(quantity) AS required_qty FROM bom_items GROUP BY material_id) dr ON dr.material_id = sl.material_id WHERE sl.quantity_on_hand < sl.min_stock ON CONFLICT (material_id) DO UPDATE SET required_qty = EXCLUDED.required_qty, available_qty = EXCLUDED.available_qty, shortage_qty = EXCLUDED.shortage_qty, suggested_order_qty = EXCLUDED.suggested_order_qty, calculated_at = NOW() RETURNING material_id`);
      return Ok((r.ok ? r.data : []).length);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getFleetVehicles(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT fv.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_driver_name FROM mm_vehicles fv LEFT JOIN employees e ON e.id = fv.driver_id ORDER BY fv.plate_number`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createFleetVehicle(body: Row): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO mm_vehicles (plate_number, type, model, year, driver_id, status, notes) VALUES (${body.plateNumber ?? body.plate_number}, ${body.vehicleType ?? body.vehicle_type ?? body.type ?? 'truck'}, ${body.model ?? null}, ${body.year ?? null}, ${body.driverId ?? body.driver_id ?? body.assigned_driver_id ?? null}, 'active', ${body.notes ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getFuelLogs(vehicleId?: number): Promise<Result<Row[]>>  {
  try {
      return vehicleId
        ? exec(sql`SELECT fl.*, fv.plate_number FROM mm_vehicle_fuel_logs fl JOIN mm_vehicles fv ON fv.id = fl.vehicle_id WHERE fl.vehicle_id = ${vehicleId} ORDER BY fl.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT fl.*, fv.plate_number FROM mm_vehicle_fuel_logs fl JOIN mm_vehicles fv ON fv.id = fl.vehicle_id ORDER BY fl.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createFuelLog(body: Row, _userId: number | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO mm_vehicle_fuel_logs (vehicle_id, log_date, fuel_amount, fuel_cost, mileage, notes) VALUES (${body.vehicleId ?? body.vehicle_id}, ${new Date().toISOString().slice(0, 10)}, ${body.liters ?? body.fuel_amount ?? 0}, ${body.totalCost ?? body.total_cost ?? body.fuel_cost ?? 0}, ${body.odometerKm ?? body.odometer_km ?? body.mileage ?? null}, ${body.notes ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getSupplierPerformance(): Promise<Result<Row[]>>  {
  try {
      // NOTE: mm_goods_receipts is empty; actual_delivery_date and expected_date columns
      // on mm_purchase_orders are the canonical source for delay calculation.
      return exec(sql`SELECT v.id, v.name, COUNT(po.id)::int AS total_orders, COUNT(po.id) FILTER (WHERE po.status = 'completed')::int AS completed_orders, COALESCE(SUM(po.total_amount), 0)::numeric(15,2) AS total_spend, COALESCE(AVG(EXTRACT(EPOCH FROM (po.actual_delivery_date - po.expected_date::timestamptz))/${SECONDS_PER_DAY}), 0)::numeric(5,1) AS avg_delay_days FROM mm_vendors v LEFT JOIN mm_purchase_orders po ON po.vendor_id = v.id WHERE v.is_active = true GROUP BY v.id, v.name ORDER BY total_spend DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPriceHistory(materialId: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT pol.unit_price, pol.quantity, po.created_at, v.name AS vendor_name FROM purchase_order_items pol JOIN mm_purchase_orders po ON po.id = pol.purchase_order_id JOIN mm_vendors v ON v.id = po.vendor_id WHERE pol.material_id = ${materialId} ORDER BY po.created_at DESC LIMIT 50`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getFleetMaintenance(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT vm.*, fv.plate_number AS vehicle_plate_number FROM mm_vehicle_maintenance vm LEFT JOIN mm_vehicles fv ON fv.id = vm.vehicle_id ORDER BY vm.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVehicleLocations(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT DISTINCT ON (vl.vehicle_id) vl.*, fv.plate_number AS vehicle_plate_number FROM vehicle_locations vl LEFT JOIN mm_vehicles fv ON fv.id = vl.vehicle_id ORDER BY vl.vehicle_id, vl.recorded_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDriverExpenses(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT de.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS driver_name FROM mm_driver_expenses de LEFT JOIN mm_drivers d ON d.id = de.driver_id LEFT JOIN employees e ON e.id = d.employee_id ORDER BY de.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVendorInvoices(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT vi.*, v.name AS vendor_name FROM vendor_invoices vi LEFT JOIN mm_vendors v ON v.id = vi.vendor_id ORDER BY vi.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVendorInvoiceById(id: number): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`SELECT vi.*, v.name AS vendor_name FROM vendor_invoices vi LEFT JOIN mm_vendors v ON v.id = vi.vendor_id WHERE vi.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getThreeWayMatch(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT vi.id AS invoice_id, vi.invoice_number, vi.invoice_no, vi.vendor_id, v.name AS vendor_name, vi.purchase_order_id, vi.goods_receipt_id, vi.total_amount, vi.amount, vi.match_status, vi.match_score, vi.price_variance, vi.quantity_variance FROM vendor_invoices vi LEFT JOIN mm_vendors v ON v.id = vi.vendor_id ORDER BY vi.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  // FX-2: mm_deliveries (lib/db/src/schema/mm-logistics.ts:198) — waybill CRUD for
  // LogisticsDashboard.tsx + MMExtended.tsx (ScheduleTab). Previously an unwired 501 stub.
  async getFleetDeliveries(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT * FROM mm_deliveries ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createFleetDelivery(body: Row): Promise<Result<Row>>  {
  try {
      const vehicleId = (body.vehicleId ?? body.vehicle_id ?? null) as string | null;
      const eta = (body.estimatedArrival ?? body.estimated_arrival) as string | undefined;
      const r = await exec(sql`INSERT INTO mm_deliveries (order_no, customer_name, address, vehicle_id, plate_number, driver_name, estimated_arrival, weight, cost, status) VALUES (${body.orderNo ?? body.order_no ?? null}, ${body.customerName ?? body.customer_name ?? null}, ${body.address ?? null}, ${vehicleId}, (SELECT plate_number FROM mm_vehicles WHERE id::varchar = ${vehicleId}), ${body.driverName ?? body.driver_name ?? null}, ${eta && eta !== '' ? eta : null}, ${body.weight ?? null}, ${body.cost ?? null}, 'planned') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateFleetDeliveryStatus(id: number, status: string): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`UPDATE mm_deliveries SET status = ${status}, updated_at = NOW(), actual_arrival = CASE WHEN ${status} = 'delivered' THEN NOW() ELSE actual_arrival END WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
