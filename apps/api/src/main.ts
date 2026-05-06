import 'module-alias/register';
import 'reflect-metadata';
import { register as promRegister } from 'prom-client';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { HttpStatus, Logger, RequestMethod } from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ChatService } from './modules/chat/chat.service';
import { ensureDbInvariants, ensureSchemaAdditions } from './shared/db/invariants';

import { DEFAULT_PORT, SECONDS_PER_YEAR, MS_PER_SECOND, MAX_FILE_SIZE } from '@common/constants/app.constants';

const BLOCKED_HTTP_METHODS = ['CONNECT', 'TRACE', 'PROPFIND'] as const;
type RawFastify = {
  addHook: (event: string, fn: (req: RawReq, reply: RawReply, done?: () => void) => unknown) => void;
  get: (path: string, fn: (req: unknown, reply: RawReply) => void | Promise<void>) => void;
};
type RawReq = { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; ip?: string };
type RawReply = { code: (n: number) => RawReply; header: (k: string, v: string) => RawReply; send: (b: unknown) => void };

async function configureSecurityHeaders(app: NestFastifyApplication): Promise<void> {
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'], connectSrc: ["'self'"], fontSrc: ["'self'"],
        objectSrc: ["'none'"], upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
    noSniff: true,
    hsts: { maxAge: SECONDS_PER_YEAR, includeSubDomains: true },
  });
}

function configureBlockedMethods(app: NestFastifyApplication): void {
  const raw = app.getHttpAdapter().getInstance() as RawFastify;
  raw.addHook('onRequest', (req: RawReq, reply: RawReply, done?: () => void) => {
    if (BLOCKED_HTTP_METHODS.includes(req.method as (typeof BLOCKED_HTTP_METHODS)[number])) {
      reply.code(HttpStatus.METHOD_NOT_ALLOWED).header('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        .send({ statusCode: HttpStatus.METHOD_NOT_ALLOWED, error: 'Method Not Allowed', message: `${req.method} metodi taqiqlangan` });
      return;
    }
    done?.();
  });

  const CONNECT_RESPONSE =
    'HTTP/1.1 405 Method Not Allowed\r\n' +
    'Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS\r\n' +
    'Content-Length: 0\r\n' +
    'Connection: close\r\n\r\n';

  const httpServer = app.getHttpServer() as import('net').Server;
  httpServer.on('connect', (_req: unknown, socket: import('net').Socket) => {
    socket.write(CONNECT_RESPONSE);
    socket.destroy();
  });
}

function configureLoginRateLimit(app: NestFastifyApplication): void {
  const loginBucket = new Map<string, { count: number; resetAt: number }>();
  const LOGIN_LIMIT = 5;
  const LOGIN_TTL_MS = 60_000;
  const raw = app.getHttpAdapter().getInstance() as RawFastify;
  raw.addHook('onRequest', async (req: RawReq, reply: RawReply) => {
    if (req.method !== 'POST' || !req.url?.startsWith('/api/auth/login')) return;
    const fwd = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]?.trim()) ?? req.ip ?? 'unknown';
    const now = Date.now();
    let entry = loginBucket.get(ip);
    if (!entry || now > entry.resetAt) { entry = { count: 0, resetAt: now + LOGIN_TTL_MS }; loginBucket.set(ip, entry); }
    entry.count++;
    if (entry.count > LOGIN_LIMIT) {
      const retryAfter = Math.ceil((entry.resetAt - now) / MS_PER_SECOND);
      reply.code(HttpStatus.TOO_MANY_REQUESTS).header('Retry-After', String(retryAfter))
        .send({ statusCode: HttpStatus.TOO_MANY_REQUESTS, error: 'Too Many Requests', message: `Login uchun juda ko'p urinish. ${retryAfter}s dan keyin qayta urinib ko'ring.` });
    }
  });
}

function configureAppMiddleware(app: NestFastifyApplication): void {
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }, { path: 'api/health', method: RequestMethod.GET }],
  });
  const origins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const isDev = process.env.NODE_ENV !== 'production';
  const isReplitOrigin = (o: string) =>
    o.endsWith('.replit.dev') || o.endsWith('.repl.co') || o.endsWith('.replit.app');
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) { cb(null, true); return; }
      if ((origins ?? []).some((a) => origin === a)) { cb(null, true); return; }
      if (isReplitOrigin(origin)) { cb(null, true); return; }
      cb(new Error(`CORS: origin '${origin}' ruxsat etilmagan`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'x-tg-session'],
  });
  // ZodValidationPipe validates only createZodDto-backed classes; unknown keys are
  // stripped (Zod default) rather than rejected — all DTO schemas are fully migrated.
  // class-validator/class-transformer packages are retained as @nestjs/swagger peer deps.
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
}

function configureSwagger(app: NestFastifyApplication, fastify: RawFastify, port: number, logger: Logger): void {
  if (process.env.NODE_ENV === 'production') return;
  const secret = process.env.SWAGGER_SECRET;
  if (!secret) { logger.warn('SWAGGER_SECRET not set — Swagger UI is disabled'); return; }
  fastify.addHook('onRequest', (req: RawReq, reply: RawReply, done?: () => void) => {
    if (req.url?.startsWith('/api/docs')) {
      const params = new URLSearchParams(req.url.split('?')[1] ?? '');
      if (params.get('secret') !== secret) { reply.code(HttpStatus.FORBIDDEN).send({ error: 'Forbidden' }); return; }
    }
    done?.();
  });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('EuroPrint ERP API v2')
    .setDescription('NestJS + Fastify + DDD + CQRS | ARCHITECTURE.md muvofiq')
    .setVersion('2.0').addBearerAuth().build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  logger.log(`Swagger: http://localhost:${port}/api/docs?secret=${secret}`);
}

function configureHealthRoutes(fastify: RawFastify): void {
  fastify.get('/', (_req, reply) => reply.code(200).send({ status: 'ok', service: 'europrint-api' }));
  fastify.get('/health', (_req, reply) => reply.code(200).send({ status: 'ok' }));
  fastify.get('/metrics', async (_req, reply) => {
    const metrics = await promRegister.metrics();
    reply.code(200).header('content-type', promRegister.contentType).send(metrics);
  });
}

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
  await app.register(require('@fastify/multipart'), { limits: { fileSize: MAX_FILE_SIZE, files: 1 } });
  configureBlockedMethods(app);
  configureLoginRateLimit(app);
  configureAppMiddleware(app);
  const fastify = app.getHttpAdapter().getInstance() as RawFastify;
  configureSwagger(app, fastify, port, logger);
  configureHealthRoutes(fastify);

  // Start listening FIRST so health checks pass within Replit's 60s timeout.
  // Heavy DB operations run in the background after the port is open.
  await app.listen(port, '0.0.0.0');
  logger.log(`EuroPrint NestJS API v2 ishga tushdi: http://localhost:${port}/api/v2`);

  // Background initialization — runs after listen() so health check never times out
  (async () => {
    try {
      await app.get(ChatService).ensureTables();
    } catch (e: unknown) {
      logger.warn(`Chat tables init: ${e}`);
    }

    // TZ-D06: SD schema additions (version column, idempotency table)
    try {
      await ensureSchemaAdditions();
      logger.log('Schema additions muvaffaqiyatli qo\'llandi');
    } catch (e: unknown) {
      logger.warn(`Schema additions xato: ${String(e)}`);
    }

    // TZ-D16: DB CHECK constraintlarini tekshirish va qo'llash
    try {
      await ensureDbInvariants();
      logger.log('DB invariantlar muvaffaqiyatli tekshirildi');
    } catch (e: unknown) {
      logger.warn(`DB invariantlar tekshiruvida xato: ${String(e)}`);
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
