import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const MaterialBalanceBodySchema = z.object({
  warehouseId:    z.number().optional(),
  materialCardId: z.number().optional(),
  quantity:       z.number().optional(),
  reason:         z.string().optional(),
}).passthrough();
export class MaterialBalanceBodyDto extends createZodDto(MaterialBalanceBodySchema) {}

const WasteBodySchema = z.object({
  materialCardId: z.number().optional(),
  quantity:       z.number().optional(),
  reason:         z.string().optional(),
  warehouseId:    z.number().optional(),
}).passthrough();
export class WasteBodyDto extends createZodDto(WasteBodySchema) {}

const WasteRecycleSchema = z.object({
  wasteId:   z.number().optional(),
  recycleMethod: z.string().optional(),
  quantity:  z.number().optional(),
}).passthrough();
export class WasteRecycleDto extends createZodDto(WasteRecycleSchema) {}
