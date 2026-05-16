/**
 * @module i-pp-equipment.repo
 * @description Domain repository interface for production equipment & work-centers.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/pp-equipment.repository.ts`.
 * @layer Domain (PP)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IPpEquipmentRepo {
  listEquipment(status: string | null, limit: number): Promise<Result<Row[]>>;
  listWorkCenters(limit: number): Promise<Result<Row[]>>;
  findById(id: number): Promise<Result<Row | null>>;
  create(body: Row): Promise<Result<Row | null>>;
  update(id: number, body: Row): Promise<Result<Row | null>>;
}

export const PP_EQUIPMENT_REPO = Symbol('PP_EQUIPMENT_REPO');
