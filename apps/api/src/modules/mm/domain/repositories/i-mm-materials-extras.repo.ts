/**
 * @module i-mm-materials-extras.repo
 * @description Domain repository interface for materials extras (raw materials,
 *   material cards). Concrete implementation lives at
 *   `infrastructure/repositories/mm-materials-extras.repository.ts`.
 * @layer Domain (MM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IMmMaterialsExtrasRepo {
  listRawMaterials(limit: number, offset: number, search?: string): Promise<Result<Row[]>>;
  listRawMaterialsFallback(limit: number, offset: number, search?: string): Promise<Result<Row[]>>;
  listMaterialCards(
    limit: number,
    offset: number,
    search?: string,
    category?: string,
  ): Promise<Result<Row[]>>;
  getMaterialCard(id: number): Promise<Result<Row | null>>;
}

export const MM_MATERIALS_EXTRAS_REPO = Symbol('MM_MATERIALS_EXTRAS_REPO');
