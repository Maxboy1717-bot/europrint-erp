/**
 * @module telegram-bots.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const TelegramSendMessageSchema = z.object({
  bot_type: z.string().min(1).max(50),
  chat_id:  z.union([z.string(), z.number()]),
  message:  z.string().min(1).max(4096),
});
export type TelegramSendMessageDto = z.infer<typeof TelegramSendMessageSchema>;

export const TelegramBroadcastSchema = z.object({
  bot_type: z.string().max(50).optional(),
  message:  z.string().min(1).max(4096),
});
export type TelegramBroadcastDto = z.infer<typeof TelegramBroadcastSchema>;

export const TelegramNotifyEmployeeSchema = z.object({
  employeeId: z.number().int().positive(),
  message:    z.string().min(1).max(4096),
});
export type TelegramNotifyEmployeeDto = z.infer<typeof TelegramNotifyEmployeeSchema>;

export const TelegramNotifyHrSchema = z.object({
  message: z.string().min(1).max(4096),
});
export type TelegramNotifyHrDto = z.infer<typeof TelegramNotifyHrSchema>;

export const TelegramVacancyPublishedSchema = z.object({
  vacancyId:      z.number().int().positive(),
  title:          z.string().min(1).max(255),
  departmentName: z.string().max(100).optional(),
  salaryMin:      z.number().positive().optional(),
  salaryMax:      z.number().positive().optional(),
});
export type TelegramVacancyPublishedDto = z.infer<typeof TelegramVacancyPublishedSchema>;
