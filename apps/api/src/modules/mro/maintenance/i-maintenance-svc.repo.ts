/**
 * @module i-maintenance-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IMaintenanceSvcRepository {
  findAll(): Promise<Result<object[]>>;
  findById(id: number): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  findEquipment(limit: number, offset: number): Promise<Result<{ data: Record<string, unknown>[]; count: number }>>;
  createEquipment(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateEquipmentStatus(id: number, status: string): Promise<Result<Record<string, unknown>>>;
  // MRO Facility Management
  findFacilities(): Promise<Result<Record<string, unknown>[]>>;
  findCleaningSchedules(): Promise<Result<Record<string, unknown>[]>>;
  findPmSchedules(): Promise<Result<Record<string, unknown>[]>>;
  findUtilityReadings(): Promise<Result<Record<string, unknown>[]>>;
  getCanteenStats(): Promise<Result<Record<string, unknown>>>;
  listCanteenLogs(logDate?: string): Promise<Result<Record<string, unknown>[]>>;
  createCanteenLog(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateCanteenLog(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  findSpareParts(search?: string): Promise<Result<Record<string, unknown>[]>>;
}

export const MAINTENANCE_SVC_REPO = 'IMaintenanceSvcRepository';
