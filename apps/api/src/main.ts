/**
 * @module main
 * @description Entry point. Bootstraps the NestJS+Fastify app, registers
 *   security headers / CSRF / rate-limit / Swagger / health routes via the
 *   helpers in `main-bootstrap.ts`, and runs the post-listen DB seed jobs.
 *
 *   Helpers were extracted to `main-bootstrap.ts` to keep this file under
 *   the 300-line cap (Rule 16).
 */

// MUST run first: @workspace/db (lib/db) reads process.env.DATABASE_URL at
// import time and throws if unset — this happens before ConfigModule.forRoot()
// due to import hoisting. Loading .env here (CWD = apps/api) populates it in time.
import 'dotenv/config';
import 'module-alias/register';
import 'reflect-metadata';
import { initSentry } from './common/monitoring/sentry.config';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { ChatService } from './modules/chat/chat.service';
import { ensureDbInvariants, ensureSchemaAdditions } from './shared/db/invariants';
import { seedPosMovementTypes } from './shared/db/seed-pos-movement-types';

import { DEFAULT_PORT, MAX_FILE_SIZE } from '@common/constants/app.constants';
import {
  configureSecurityHeaders,
  configureBlockedMethods,
  configureCsrfOriginCheck,
  configureLoginRateLimit,
  configureAppMiddleware,
  configureSwagger,
  configureHealthRoutes,
  registerBufferParsers,
  RawFastify,
} from './main-bootstrap';

// Initialise Sentry as early as possible — its `process.on('uncaughtException')`
// hook must be attached BEFORE bootstrap() runs.  `initSentry()` is a no-op
// (with warn log) when SENTRY_DSN is empty (graceful degradation, matches
// AishaConfig).  Module-level call runs synchronously on first import.
initSentry();

// Eslatma: 404 handling NestJS Global Exception Filter ichida amalga oshiriladi
// (apps/api/src/common/filters/global-exception.filter.ts). Fastify'ning
// `setNotFoundHandler` ni alohida o'rnatib bo'lmaydi — Nest o'zi o'rnatadi.

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV === 'development', trustProxy: true, ignoreTrailingSlash: true }),
    { logger: ['error', 'warn', 'log', 'debug'] },
  );
  app.useWebSocketAdapter(new IoAdapter(app));
  const logger = new Logger('Bootstrap');
  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  await configureSecurityHeaders(app);
  // @fastify/cookie — enables httpOnly cookie auth (access_token / refresh_token).
  // Registered before other plugins so cookies are parsed on every request, and
  // are available via `request.cookies` in NestJS guards / controllers.
  // The COOKIE_SECRET env var is OPTIONAL: cookies are httpOnly + sameSite=strict
  // already, so signing them is defense-in-depth, not required for MVP.
  try {
     
    const fastifyCookie = require('@fastify/cookie');
    await app.register(fastifyCookie.default ?? fastifyCookie, {
      secret: process.env.COOKIE_SECRET, // optional — undefined disables signing
      parseOptions: {},
    });
  } catch (e: unknown) {
    new Logger('Bootstrap').warn(
      `@fastify/cookie ro'yxatdan o'tmadi — Bearer token rejimi ishlatiladi: ${String(e)}`,
    );
  }
   
  await app.register(require('@fastify/multipart'), { limits: { fileSize: MAX_FILE_SIZE, files: 1 } });

  // Parse raw binary uploads as Buffer. Registered AFTER multipart so
  // multipart/form-data is still handled by @fastify/multipart.
  registerBufferParsers(app);

  configureBlockedMethods(app);
  configureCsrfOriginCheck(app, logger);
  configureLoginRateLimit(app);
  configureAppMiddleware(app);
  const fastify = app.getHttpAdapter().getInstance() as RawFastify;
  configureSwagger(app, fastify, port, logger);
  configureHealthRoutes(fastify);

  // TZ-D06: SD schema additions (version column, idempotency table)
  try {
    await ensureDbInvariants();
    logger.log('DB invariantlar muvaffaqiyatli tekshirildi');
  } catch (e: unknown) {
    logger.warn(`DB invariantlar tekshiruvida xato: ${String(e)}`);
  }

  // TZ-D16: DB CHECK constraintlarini tekshirish va qo'llash
  try {
    await ensureSchemaAdditions();
    logger.log('Schema additions muvaffaqiyatli qo\'llandi');
  } catch (e: unknown) {
    logger.warn(`Schema additions xato: ${String(e)}`);
  }

  // POS Monitor — 7 ta harakat turini seed qilish (idempotent, Drizzle ORM)
  try {
    await seedPosMovementTypes();
  } catch (e: unknown) {
    logger.warn(`pos_movement_types seed xato: ${String(e)}`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`EuroPrint NestJS API v2 ishga tushdi: http://localhost:${port}/api/v2`);

  // Background initialization — chat tables are non-critical, run after listen
  (async () => {
    try {
      await app.get(ChatService).ensureTables();
    } catch (e: unknown) {
      logger.warn(`Chat tables init: ${e}`);
    }
  })().catch((e: unknown) => logger.warn(`Background init xato: ${String(e)}`));
}

// ── Graceful SIGTERM during cold-start ───────────────────────────────────────
// Replit's health-check sends SIGTERM after ~60 s when port is not open yet.
// By default Node.js exits immediately on SIGTERM.  This handler keeps the
// process alive until the HTTP server has successfully bound to its port
// (up to 30 s extra), then exits cleanly.  Without this, a 60-second cold
// start is killed just before app.listen() completes.
let _serverReady = false;
process.on('SIGTERM', () => {
  if (_serverReady) {
    process.exit(0);
    return;
  }
  const logger = new Logger('SIGTERM');
  logger.warn('SIGTERM received before server ready — waiting up to 30 s for port to open…');
  const deadline = setTimeout(() => {
    logger.error('Server did not start in time — exiting after SIGTERM deadline');
    process.exit(0);
  }, 30_000);
  deadline.unref();
  const check = setInterval(() => {
    if (_serverReady) {
      clearInterval(check);
      clearTimeout(deadline);
      logger.log('Server is ready — exiting gracefully after SIGTERM');
      process.exit(0);
    }
  }, 500);
});

bootstrap()
  .then(() => { _serverReady = true; })
  .catch((err: unknown) => {
    const logger = new Logger('Bootstrap');
    if (err instanceof Error) {
      logger.error(`Startup failed: ${err.message}`);
      logger.error(err.stack ?? '(stack yo\'q)');
    } else {
      logger.error(`Startup failed: ${String(err)}`);
      try { logger.error(JSON.stringify(err, null, 2)); } catch { /* ignore */ }
    }
    process.exit(1);
  });
