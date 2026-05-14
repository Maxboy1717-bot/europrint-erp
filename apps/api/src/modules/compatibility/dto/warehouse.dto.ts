/**
 * @module warehouse.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const ReceiveBodySchema = z.object({
  movementType: z.string().optional(),
  lotNumber:    z.string().optional(),
  notes:        z.string().optional(),
  warehouseId:  z.number().optional(),
}).passthrough();
export class ReceiveBodyDto extends createZodDto(ReceiveBodySchema) {}

const ProductionReceiveSchema = z.object({
  lotNumber:     z.string().optional(),
  notes:         z.string().optional(),
  productionId:  z.number().optional(),
  quantity:      z.number().optional(),
}).passthrough();
export class ProductionReceiveDto extends createZodDto(ProductionReceiveSchema) {}

const ProductionCompleteSchema = z.object({
  movementId: z.string().optional(),
  notes:      z.string().optional(),
}).passthrough();
export class ProductionCompleteDto extends createZodDto(ProductionCompleteSchema) {}

const PickTaskSchema = z.object({
  pickedQuantity: z.number().optional(),
  notes:          z.string().optional(),
}).passthrough();
export class PickTaskDto extends createZodDto(PickTaskSchema) {}

const ResolveBalanceSchema = z.object({
  resolution: z.string().optional(),
  notes:      z.string().optional(),
}).passthrough();
export class ResolveBalanceDto extends createZodDto(ResolveBalanceSchema) {}

const CycleCountSubmitSchema = z.object({
  countedQuantity: z.number().optional(),
  systemQuantity:  z.number().optional(),
  notes:           z.string().optional(),
}).passthrough();
export class CycleCountSubmitDto extends createZodDto(CycleCountSubmitSchema) {}

const WarehouseCreateSchema = z.object({
  name:        z.string().optional(),
  code:        z.string().optional(),
  type:        z.string().optional(),
  location:    z.string().optional(),
  capacity:    z.number().optional(),
  description: z.string().optional(),
}).passthrough();
export class WarehouseCreateDto extends createZodDto(WarehouseCreateSchema) {}

const WarehouseUpdateSchema = z.object({
  name:        z.string().optional(),
  code:        z.string().optional(),
  type:        z.string().optional(),
  location:    z.string().optional(),
  capacity:    z.number().optional(),
  description: z.string().optional(),
  isActive:    z.boolean().optional(),
}).passthrough();
export class WarehouseUpdateDto extends createZodDto(WarehouseUpdateSchema) {}
