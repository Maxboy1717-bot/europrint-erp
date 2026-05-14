/**
 * @module change-password.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(8).describe('Kamida 8 ta belgi, katta/kichik harf, raqam va maxsus belgi'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Parollar mos kelmaydi',
  path: ['confirmPassword'],
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
