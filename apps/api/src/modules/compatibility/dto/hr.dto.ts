/**
 * @module hr.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const AdaptationSchema = z.object({
  employeeId:    z.number().optional(),
  mentorId:      z.number().optional(),
  startDate:     z.string().optional(),
  status:        z.string().optional(),
  notes:         z.string().optional(),
}).passthrough();
export class AdaptationBodyDto extends createZodDto(AdaptationSchema) {}

const AdaptationUpdateSchema = z.object({
  status:    z.string().optional(),
  progress:  z.number().optional(),
  notes:     z.string().optional(),
}).passthrough();
export class AdaptationUpdateDto extends createZodDto(AdaptationUpdateSchema) {}

const AdaptationTaskSchema = z.object({
  title:       z.string().optional(),
  description: z.string().optional(),
  dueDate:     z.string().optional(),
  assignedTo:  z.number().optional(),
}).passthrough();
export class AdaptationTaskDto extends createZodDto(AdaptationTaskSchema) {}

const SuccessionBodySchema = z.object({
  positionId:    z.number().optional(),
  candidateId:   z.number().optional(),
  readinessLevel: z.string().optional(),
  notes:         z.string().optional(),
}).passthrough();
export class SuccessionBodyDto extends createZodDto(SuccessionBodySchema) {}

const KpiBodySchema = z.object({
  employeeId:  z.number().optional(),
  period:      z.string().optional(),
  score:       z.number().optional(),
  notes:       z.string().optional(),
}).passthrough();
export class KpiBodyDto extends createZodDto(KpiBodySchema) {}

const AttendanceBodySchema = z.object({
  employeeId:    z.number().optional(),
  checkIn:       z.string().optional(),
  checkOut:      z.string().optional(),
  zoneId:        z.string().optional(),
  date:          z.string().optional(),
}).passthrough();
export class AttendanceBodyDto extends createZodDto(AttendanceBodySchema) {}
