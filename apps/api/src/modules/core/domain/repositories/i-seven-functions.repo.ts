/**
 * @module i-seven-functions.repo
 * @description Domain repository interface for "Seven Functions" core module
 *   (functions + KPIs). Concrete implementation lives at
 *   `infrastructure/repositories/seven-functions.repository.ts`.
 * @layer Domain (Core)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ISevenFunctionsRepo {
  listFunctions(): Promise<Result<Row[]>>;
  getFunction(id: number): Promise<Result<Row[]>>;
  createFunction(
    name: string,
    description: string | null,
    ownerId: number,
    orderIndex: number,
    createdBy: number,
  ): Promise<Result<Row>>;
  updateFunction(
    id: number,
    name: string | null,
    description: string | null,
    ownerId: number | null,
    orderIndex: number | null,
  ): Promise<Result<Row>>;
  deleteFunction(id: number): Promise<void>;
  getFunctionKpis(functionId: number): Promise<Result<Row[]>>;
  createKpi(
    functionId: number,
    name: string,
    targetValue: number | null,
    unit: string,
    responsibleId: number | null,
    frequency: string,
  ): Promise<Result<Row>>;
  updateKpi(
    id: number,
    name: string | null,
    targetValue: number | null,
    actualValue: number | null,
    unit: string | null,
    responsibleId: number | null,
  ): Promise<Result<Row>>;
  deleteKpi(id: number): Promise<void>;
  getFunctionForAnalysis(functionId: number): Promise<Result<Row[]>>;
  getKpisForAnalysis(functionId: number): Promise<Result<Row[]>>;
}

export const SEVEN_FUNCTIONS_REPO = Symbol('SEVEN_FUNCTIONS_REPO');
