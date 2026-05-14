/**
 * @module mm-dashboard.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

import { SECONDS_PER_DAY, MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class MmDashboardRepository {
  async getDashboardStats(): Promise<Result<Row>>  {
  try {  
      const rows = await exec(sql`SELECT (SELECT COUNT(*)::int FROM mm_purchase_orders WHERE status = 'pending') AS pending_po, (SELECT COUNT(*)::int FROM mm_purchase_orders WHERE status = 'approved') AS approved_po, (SELECT COALESCE(SUM(total_amount), 0)::numeric(15,2) FROM mm_purchase_orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS monthly_po_value, (SELECT COUNT(*)::int FROM mm_purchase_requisitions WHERE status = 'pending') AS pending_pr, (SELECT COUNT(*)::int FROM mm_vendors WHERE is_active = true) AS active_vendors, (SELECT COUNT(*)::int FROM wms_alerts WHERE is_resolved = false) AS open_alerts`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVendorRatings(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT v.id, v.name, v.contact_email, COALESCE(AVG(vr.quality_score), 0)::numeric(4,2) AS avg_quality, COALESCE(AVG(vr.delivery_score), 0)::numeric(4,2) AS avg_delivery, COALESCE(AVG(vr.price_score), 0)::numeric(4,2) AS avg_price, COUNT(vr.id)::int AS rating_count, MAX(vr.rated_at) AS last_rated FROM mm_vendors v LEFT JOIN mm_vendor_ratings vr ON vr.vendor_id = v.id WHERE v.is_active = true GROUP BY v.id, v.name, v.contact_email ORDER BY avg_quality DESC`);  } catch (_e) {
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
      return exec(sql`SELECT fv.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS driver_name FROM mm_vehicles fv LEFT JOIN employees e ON e.id = fv.assigned_driver_id ORDER BY fv.plate_number`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createFleetVehicle(body: Row): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO mm_vehicles (plate_number, vehicle_type, brand, model, year, assigned_driver_id, status, notes) VALUES (${body.plateNumber ?? body.plate_number}, ${body.vehicleType ?? body.vehicle_type ?? 'truck'}, ${body.brand ?? body.make ?? null}, ${body.model ?? null}, ${body.year ?? null}, ${body.driverId ?? body.driver_id ?? body.assigned_driver_id ?? null}, 'active', ${body.notes ?? null}) RETURNING *`);
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

  async createFuelLog(body: Row, userId: number | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO mm_vehicle_fuel_logs (vehicle_id, log_date, fuel_amount, fuel_cost, mileage, notes) VALUES (${body.vehicleId ?? body.vehicle_id}, ${new Date().toISOString().slice(0, 10)}, ${body.liters ?? body.fuel_amount ?? 0}, ${body.totalCost ?? body.total_cost ?? body.fuel_cost ?? 0}, ${body.odometerKm ?? body.odometer_km ?? body.mileage ?? null}, ${body.notes ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getSupplierPerformance(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT v.id, v.name, COUNT(po.id)::int AS total_orders, COUNT(po.id) FILTER (WHERE po.status = 'completed')::int AS completed_orders, COALESCE(SUM(po.total_amount), 0)::numeric(15,2) AS total_spend, COALESCE(AVG(EXTRACT(EPOCH FROM (gr.received_at - po.expected_delivery_date))/${SECONDS_PER_DAY}), 0)::numeric(5,1) AS avg_delay_days FROM mm_vendors v LEFT JOIN mm_purchase_orders po ON po.vendor_id = v.id LEFT JOIN mm_goods_receipts gr ON gr.purchase_order_id = po.id WHERE v.is_active = true GROUP BY v.id, v.name ORDER BY total_spend DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPriceHistory(materialId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pol.unit_price, pol.quantity, po.created_at, v.name AS vendor_name FROM mm_purchase_order_lines pol JOIN mm_purchase_orders po ON po.id = pol.purchase_order_id JOIN mm_vendors v ON v.id = po.vendor_id WHERE pol.material_id = ${materialId} ORDER BY po.created_at DESC LIMIT 50`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
