/**
 * @module sd-order-departments.dto
 * @description DTO + Zod schema. The manager's per-order department selection (Phase 4
 *   fan-out source): which departments an order needs, and (for mold) new vs reuse.
 */

import { z } from 'zod';

export const ORDER_DEPARTMENTS = ['design', 'mold', 'cliche', 'warehouse', 'production', 'logistics'] as const;

export const SetOrderDepartmentsSchema = z.object({
  departments: z.array(z.object({
    department: z.enum(ORDER_DEPARTMENTS),
    mode: z.enum(['new', 'reuse']).optional(),
  })).min(1, { message: 'Kamida bitta bo\'lim tanlanishi kerak' }),
});
export type SetOrderDepartmentsDto = z.infer<typeof SetOrderDepartmentsSchema>;
