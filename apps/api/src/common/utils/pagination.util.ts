/**
 * @module pagination.util
 * @description Source module. See exports for details.
 */

import { PaginatedResult } from '../types/result.type'

export interface PaginationParams {
  page: number
  limit: number
}

export class PaginationUtil {
  static getPaginationParams(query: Record<string, unknown>): PaginationParams {
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10))

    return { page, limit }
  }

  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit
  }

  static createPaginatedResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    return {
      items,
      total,
      page,
      limit,
    }
  }

  static calculatePageCount(total: number, limit: number): number {
    return Math.ceil(total / limit)
  }

  static hasNextPage(page: number, total: number, limit: number): boolean {
    return page < this.calculatePageCount(total, limit)
  }

  static hasPreviousPage(page: number): boolean {
    return page > 1
  }
}
