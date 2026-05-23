/**
 * @module env.schema
 * @description Boot-time environment validation with Zod. Fails fast at startup
 *   if required env vars are missing or malformed. Optional vars surface as
 *   warnings only.
 */

import { z } from 'zod';
import { Logger } from '@nestjs/common';

const requiredEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgres URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be ≥32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be ≥32 chars'),
  ADMIN_SEED_PASSWORD: z.string().min(8, 'ADMIN_SEED_PASSWORD ≥8 chars'),
  FRONTEND_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string(),
});

const optionalEnvSchema = z.object({
  SENTRY_DSN: z.string().optional(),
  AI_INTEGRATIONS_GEMINI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_GEMINI_LIVE_URL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  PGSSLMODE: z.enum(['disable', 'require', 'prefer']).optional(),
});

export type EnvConfig = z.infer<typeof requiredEnvSchema> & z.infer<typeof optionalEnvSchema>;

const logger = new Logger('EnvValidation');

export function validateEnv(rawEnv: Record<string, string | undefined> = process.env): EnvConfig {
  const requiredResult = requiredEnvSchema.safeParse(rawEnv);
  if (!requiredResult.success) {
    logger.error('❌ Required environment variables are invalid:');
    for (const issue of requiredResult.error.issues) {
      logger.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Environment validation failed — aborting startup');
  }

  const optionalResult = optionalEnvSchema.safeParse(rawEnv);
  if (!optionalResult.success) {
    logger.warn('⚠ Optional env vars have format issues:');
    for (const issue of optionalResult.error.issues) {
      logger.warn(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const config = { ...requiredResult.data, ...(optionalResult.success ? optionalResult.data : {}) };

  // Warn for production-only critical secrets that aren't set
  if (config.NODE_ENV === 'production') {
    if (!config.SENTRY_DSN) logger.warn('⚠ SENTRY_DSN not set in production');
    if (!config.AI_INTEGRATIONS_GEMINI_API_KEY) logger.warn('⚠ GEMINI key not set — AI features disabled');
  }

  logger.log(`✅ Env validated (NODE_ENV=${config.NODE_ENV})`);
  return config;
}
