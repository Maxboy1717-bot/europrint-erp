/**
 * @module otp.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const VerifyOtpSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  sessionId: z.string().uuid('sessionId must be a valid UUID'),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
