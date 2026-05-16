/**
 * @module i-iot-enhanced.repo
 * @description Domain repository interface for IoT-enhanced production
 *   orders + material kits, BOM calculation, and kit items / status updates.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/iot-enhanced.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IIotEnhancedRepo {
  getOrdersForKits(status?: string): Promise<Result<Row[]>>;
  getMaterialKits(status?: string): Promise<Result<Row[]>>;
  createMaterialKit(body: Row, userId: number | null): Promise<Result<Row>>;
  calculateBom(orderId: number): Promise<Result<Row[]>>;
  getKitItems(kitId: number): Promise<Result<Row[]>>;
  addKitItem(kitId: number, body: Row): Promise<Result<Row>>;
  getMaterialKitById(kitId: number): Promise<Result<Row | null>>;
  updateMaterialKitStatus(kitId: number, status: string): Promise<Result<Row | null>>;
}

export const IOT_ENHANCED_REPO = Symbol('IOT_ENHANCED_REPO');
