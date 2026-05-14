/**
 * @module exception.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const ExceptionLogCreateSchema = z.object({
  orderId:      z.number().optional(),
  orderRef:     z.string().optional(),
  message:      z.string().optional(),
  severity:     z.string().optional(),
  exceptionType: z.string().optional(),
}).passthrough();
export class ExceptionLogCreateDto extends createZodDto(ExceptionLogCreateSchema) {}

const ExceptionReasonSchema = z.object({
  reason:  z.string().optional(),
  details: z.string().optional(),
}).passthrough();
export class ExceptionReasonDto extends createZodDto(ExceptionReasonSchema) {}

const StatusChangeSchema = z.object({
  status: z.string().optional(),
  reason: z.string().optional(),
  notes:  z.string().optional(),
}).passthrough();
export class StatusChangeDto extends createZodDto(StatusChangeSchema) {}
