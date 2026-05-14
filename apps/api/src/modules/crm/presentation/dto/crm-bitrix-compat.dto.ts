/**
 * @module crm-bitrix-compat.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const CreateRobotDtoSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.string().max(100).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
}).passthrough();
export type CreateRobotDto = z.infer<typeof CreateRobotDtoSchema>;

export const UpdateRobotDtoSchema = CreateRobotDtoSchema;
export type UpdateRobotDto = z.infer<typeof UpdateRobotDtoSchema>;
