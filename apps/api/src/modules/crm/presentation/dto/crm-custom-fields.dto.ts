/**
 * @module crm-custom-fields.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const CreateCustomFieldDtoSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  field_type: z.string().min(1).max(50).optional(),
  entity_type: z.string().min(1).max(50).optional(),
  is_required: z.boolean().optional(),
}).passthrough();
export type CreateCustomFieldDto = z.infer<typeof CreateCustomFieldDtoSchema>;

export const UpdateCustomFieldDtoSchema = CreateCustomFieldDtoSchema;
export type UpdateCustomFieldDto = z.infer<typeof UpdateCustomFieldDtoSchema>;

export const ReorderCustomFieldsDtoSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      order_index: z.number().int().nonnegative(),
    }),
  ).min(1),
});
export type ReorderCustomFieldsDto = z.infer<typeof ReorderCustomFieldsDtoSchema>;
