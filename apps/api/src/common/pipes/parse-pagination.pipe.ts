/**
 * @module parse-pagination.pipe
 * @description NestJS pipe. Transforms or validates the request payload before the handler runs.
 */

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';

export { MAX_QUERY_LIMIT };

export interface PaginationParams {
  limit: number;
  offset: number;
}

@Injectable()
export class ParsePaginationPipe implements PipeTransform {
  transform(value: { limit?: string; offset?: string }, _meta: ArgumentMetadata): PaginationParams {
    return parsePagination(value?.limit, value?.offset);
  }
}

export function parsePagination(limitParam?: string, offsetParam?: string): PaginationParams {
  return {
    limit:  Math.min(parseInt(limitParam  ?? '50', 10) || 50,  MAX_QUERY_LIMIT),
    offset: Math.min(parseInt(offsetParam ?? '0',  10) || 0,   Number.MAX_SAFE_INTEGER),
  };
}
