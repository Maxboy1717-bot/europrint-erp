/**
 * @module database.config
 * @description Configuration loader. Wraps env vars via @nestjs/config ConfigService.
 */

import { registerAs } from '@nestjs/config'

export default registerAs('database', () => {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('FATAL: DATABASE_URL environment variable is not set. Cannot start application.');
  }
  return {
  url,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: true,
          ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
        }
      : false,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
  },
  logging: process.env.NODE_ENV !== 'production',
  timezone: '+05:00', // O'zbekiston vaqti
  };
})
