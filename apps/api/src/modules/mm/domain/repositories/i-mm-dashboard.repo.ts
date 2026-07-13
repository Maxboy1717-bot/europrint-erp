/**
 * @module i-mm-dashboard.repo
 * @description Domain repository interface for MM dashboard queries
 *   (purchase / vendor / MRP / fleet stats). Concrete implementation lives at
 *   `infrastructure/repositories/mm-dashboard.repository.ts`.
 * @layer Domain (MM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IMmDashboardRepo {
  getDashboardStats(): Promise<Result<Row>>;
  getVendorRatings(): Promise<Result<Row[]>>;
  getMrpResults(materialId?: number): Promise<Result<Row[]>>;
  runMrp(): Promise<Result<number>>;
  getFleetVehicles(): Promise<Result<Row[]>>;
  createFleetVehicle(body: Row): Promise<Result<Row>>;
  getFuelLogs(vehicleId?: number): Promise<Result<Row[]>>;
  createFuelLog(body: Row, userId: number | null): Promise<Result<Row>>;
  getSupplierPerformance(): Promise<Result<Row[]>>;
  getPriceHistory(materialId: number): Promise<Result<Row[]>>;
  getFleetMaintenance(): Promise<Result<Row[]>>;
  getVehicleLocations(): Promise<Result<Row[]>>;
  getDriverExpenses(): Promise<Result<Row[]>>;
  getVendorInvoices(): Promise<Result<Row[]>>;
  getVendorInvoiceById(id: number): Promise<Result<Row | null>>;
  getThreeWayMatch(): Promise<Result<Row[]>>;
  getFleetDeliveries(): Promise<Result<Row[]>>;
  createFleetDelivery(body: Row): Promise<Result<Row>>;
  updateFleetDeliveryStatus(id: number, status: string): Promise<Result<Row | null>>;
}

export const MM_DASHBOARD_REPO = Symbol('MM_DASHBOARD_REPO');
