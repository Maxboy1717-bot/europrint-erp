/**
 * @module i-attendance.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IAttendanceRepository {
  findAll(opts: { limit: number; offset: number; userId?: number; date?: string; status?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>>;
  findTodayAll(): Promise<Result<Record<string, unknown>[]>>;
  checkIn(userId: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  checkOut(userId: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  findEmployeeByEmbedding(vectorLiteral: string, threshold: number): Promise<Result<{ id: number | null; distance: number }>>;
  findAllWithEmbeddings(): Promise<{ id: number; face_embedding: number[] | null }[]>;
  saveEmployeeFaceEmbedding(employeeId: number, embedding: number[], confidence: number, imageUrl?: string): Promise<Result<{ id: number }>>;
}

export const ATTENDANCE_REPO = 'IAttendanceRepository';
