/**
 * pagination.dto.ts — Canonical manbaa: pagination.zod.ts
 *
 * Bu fayl pagination.zod.ts dan re-export qiladi.
 * To'g'ridan-to'g'ri pagination.zod.ts dan import qilish afzalroq.
 */
export {
  PaginationSchema,
  PaginationQuerySchema,
  resolveOffset,
  resolveOffset as resolvedOffset,
} from './pagination.zod';

export type {
  PaginationInput,
  PaginationOutput,
  PaginationOutput as PaginationDto,
} from './pagination.zod';
