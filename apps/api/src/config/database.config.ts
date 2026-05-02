import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
  },
  logging: process.env.NODE_ENV !== 'production',
  timezone: '+05:00', // O'zbekiston vaqti
}))
