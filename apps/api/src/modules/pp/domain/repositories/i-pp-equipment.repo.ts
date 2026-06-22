/**
 * @module i-pp-equipment.repo
 * @description Domain repository interface for production equipment & work-centers.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/pp-equipment.repository.ts`.
 * @layer Domain (PP)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

/**
 * Equipment 360 — full machine view aggregated from the live manufacturing
 * tables. Every field is a real SELECT; tables with no matching rows return
 * an honest-empty array/null (never a fabricated value). `telemetry` is kept
 * deliberately honest-empty per the owner: IoT sensors are not installed, so
 * `mes_telemetry` (seed/demo rows) is NOT surfaced here.
 */
export interface Equipment360 {
  equipment: Row | null;
  currentStatus: Row | null;
  oee: Row | null;
  productionSessions: Row[];
  downtimeEvents: Row[];
  statusHistory: Row[];
  maintenance: Row[];
  assignedOperator: Row | null;
  utilization: Row | null;
  telemetry: Row[];
  telemetryNote: string;
}

export interface IPpEquipmentRepo {
  listEquipment(status: string | null, limit: number): Promise<Result<Row[]>>;
  listWorkCenters(limit: number): Promise<Result<Row[]>>;
  findById(id: number): Promise<Result<Row | null>>;
  getEquipment360(id: number): Promise<Result<Equipment360 | null>>;
  create(body: Row): Promise<Result<Row | null>>;
  update(id: number, body: Row): Promise<Result<Row | null>>;
}

export const PP_EQUIPMENT_REPO = Symbol('PP_EQUIPMENT_REPO');
