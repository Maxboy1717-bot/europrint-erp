/**
 * @module crm.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const CrmCreateTaskSchema = z.object({
  title:      z.string().optional(),
  customerId: z.number().optional(),
  assigneeId: z.number().optional(),
  dueDate:    z.string().optional(),
  priority:   z.string().optional(),
  notes:      z.string().optional(),
}).passthrough();
export class CrmCreateTaskDto extends createZodDto(CrmCreateTaskSchema) {}

const CrmChatSchema = z.object({
  message:    z.string().optional(),
  customerId: z.number().optional(),
  sessionId:  z.string().optional(),
}).passthrough();
export class CrmChatDto extends createZodDto(CrmChatSchema) {}

const CrmAutoTasksSchema = z.object({
  customerId: z.number().optional(),
  context:    z.string().optional(),
}).passthrough();
export class CrmAutoTasksDto extends createZodDto(CrmAutoTasksSchema) {}

const CrmChurnSchema = z.object({
  customerId:  z.number().optional(),
  periodDays:  z.number().optional(),
}).passthrough();
export class CrmChurnDto extends createZodDto(CrmChurnSchema) {}

const CrmVoiceSchema = z.object({
  audioUrl:   z.string().optional(),
  customerId: z.number().optional(),
  language:   z.string().optional(),
}).passthrough();
export class CrmVoiceDto extends createZodDto(CrmVoiceSchema) {}
