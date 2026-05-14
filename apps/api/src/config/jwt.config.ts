/**
 * @module jwt.config
 * @description Configuration loader. Wraps env vars via @nestjs/config ConfigService.
 */

import { registerAs } from '@nestjs/config'

export default registerAs('jwt', () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Cannot start application.');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is not set. Cannot start application.');
  }
  return {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: 'europrint-erp',
  };
})
