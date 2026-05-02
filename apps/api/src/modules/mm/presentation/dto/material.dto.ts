import { z } from 'zod';

export const CreateMaterialDtoSchema = z.object({
  materialCode: z.string().min(2, 'Material code must be at least 2 characters').toUpperCase(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.enum(['raw_material', 'packaging', 'spare_part', 'consumable']),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  minStock: z.number().min(0, 'Min stock must be >= 0'),
  maxStock: z.number().min(0, 'Max stock must be >= 0'),
  unitCost: z.number().min(0, 'Unit cost must be >= 0'),
});

export type CreateMaterialDto = z.infer<typeof CreateMaterialDtoSchema>;

export const UpdateMaterialDtoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  category: z.enum(['raw_material', 'packaging', 'spare_part', 'consumable']).optional(),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').optional(),
  minStock: z.number().min(0, 'Min stock must be >= 0').optional(),
  maxStock: z.number().min(0, 'Max stock must be >= 0').optional(),
  unitCost: z.number().min(0, 'Unit cost must be >= 0').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateMaterialDto = z.infer<typeof UpdateMaterialDtoSchema>;

export const GetMaterialsDtoSchema = z.object({
  category: z.enum(['raw_material', 'packaging', 'spare_part', 'consumable']).optional(),
  isActive: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetMaterialsDto = z.infer<typeof GetMaterialsDtoSchema>;
