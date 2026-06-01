/**
 * @module main-bootstrap
 * @description Extracted bootstrap helpers from main.ts to keep main.ts
 *   under the 300-line cap (Rule 16). Pure adapter / middleware wiring —
 *   no module-level side effects beyond the helpers' explicit registrations
 *   on the passed-in app instance.
 */

import { register as promRegister } from 'prom-client';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { HttpStatus, Logger, RequestMethod } from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SentryInterceptor } from './common/monitoring/sentry.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SECONDS_PER_YEAR, MS_PER_SECOND } from '@common/constants/app.constants';

// ── Internal types — mirror fastify's raw adapter shape ─────────────────────
export type RawFastify = {
  addHook: (event: string, fn: (req: RawReq, reply: RawReply, done?: () => void) => unknown) => void;
  get: (path: string, fn: (req: unknown, reply: RawReply) => void | Promise<void>) => void;
};
export type RawReq = { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; ip?: string };
export type RawReply = { code: (n: number) => RawReply; header: (k: string, v: string) => RawReply; send: (b: unknown) => void };

const BLOCKED_HTTP_METHODS = ['CONNECT', 'TRACE', 'PROPFIND'] as const;
// State-changing methods that must originate from a trusted origin. GET / HEAD
// / OPTIONS are excluded because they're either safe by definition or part of
// the preflight handshake (which is already gated by enableCors below).
const CSRF_PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function configureSecurityHeaders(app: NestFastifyApplication): Promise<void> {
   
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

  // Permissions-Policy is not emitted by @fastify/helmet by default. Lock down powerful
  // browser features the ERP never uses from third-party frames/scripts.
  const rawApp = app.getHttpAdapter().getInstance() as RawFastify;
  rawApp.addHook('onRequest', (_req: RawReq, reply: RawReply, done?: () => void) => {
    (reply as unknown as { header: (k: string, v: string) => void }).header(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    );
    done?.();
  });
}

export function configureBlockedMethods(app: NestFastifyApplication): void {
  const raw = app.getHttpAdapter().getInstance() as RawFastify;
  raw.addHook('onRequest', (req: RawReq, reply: RawReply, done?: () => void) => {
    if (BLOCKED_HTTP_METHODS.includes(req.method as (typeof BLOCKED_HTTP_METHODS)[number])) {
      reply.code(HttpStatus.METHOD_NOT_ALLOWED).header('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        .send({ statusCode: HttpStatus.METHOD_NOT_ALLOWED, error: 'Method Not Allowed', message: `${req.method} metodi taqiqlangan` });
      return;
    }
    done?.();
  });

  const CONNECT_RESPONSE = 'HTTP/1.1 405 Method Not Allowed\r\nAllow: GET, POST, PUT, PATCH, DELETE, OPTIONS\r\nContent-Length: 0\r\nConnection: close\r\n\r\n';

  const httpServer = app.getHttpServer() as import('net').Server;
  httpServer.on('connect', (_req: unknown, socket: import('net').Socket) => {
    socket.write(CONNECT_RESPONSE);
    socket.destroy();
  });
}

/**
 * CSRF mitigation (audit C.26).
 *
 * Strategy: combine `SameSite=Strict` cookies (set in auth.controller.ts) with
 * Origin / Referer validation on every state-changing request.
 */
export function configureCsrfOriginCheck(app: NestFastifyApplication, logger: Logger): void {
  const origins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const isDev = process.env.NODE_ENV !== 'production';
  const isReplitOrigin = (host: string) =>
    host.endsWith('.replit.dev') || host.endsWith('.repl.co') || host.endsWith('.replit.app');

  const isLocalhostOrigin = (host: string) =>
    host === 'localhost' || host.startsWith('localhost:') ||
    host === '127.0.0.1' || host.startsWith('127.0.0.1:') ||
    host === '[::1]' || host.startsWith('[::1]:');

  const isOriginAllowed = (origin: string): boolean => {
    if (origins.includes(origin)) return true;
    if (!isDev) return false;
    try {
      const host = new URL(origin).host;
      // In development allow any localhost/127.0.0.1 origin so the Vite dev
      // server (any port) can reach the API without listing every port in
      // ALLOWED_ORIGINS. Production still requires explicit origin allowlisting.
      return isReplitOrigin(host) || isLocalhostOrigin(host);
    } catch {
      return false;
    }
  };

  // Auth endpoints use httpOnly SameSite=Strict cookies — browser-level
  // SameSite enforcement already blocks cross-site CSRF for these routes.
  // "Login CSRF" (forcing a victim to log in as the attacker) requires the
  // attacker to know the victim's credentials, which defeats the attack.
  // Excluding these paths avoids false-positive 403s from the Vite dev proxy.
  const CSRF_SKIP_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

  const raw = app.getHttpAdapter().getInstance() as RawFastify;
  raw.addHook('onRequest', (req: RawReq, reply: RawReply, done?: () => void) => {
    const method = (req.method ?? '').toUpperCase();
    if (!CSRF_PROTECTED_METHODS.has(method)) { done?.(); return; }

    const url = req.url ?? '';

    // Auth endpoints are exempt — SameSite=Strict cookies provide equivalent protection.
    if (CSRF_SKIP_PATHS.some((p) => url.startsWith(p) || url.includes(p))) { done?.(); return; }

    const originHeader = (req.headers['origin'] as string | undefined) ?? undefined;
    const refererHeader = (req.headers['referer'] as string | undefined) ?? undefined;

    if (!originHeader && !refererHeader) { done?.(); return; }

    const candidate = originHeader ?? (refererHeader ? refererHeader.replace(/^(https?:\/\/[^/]+).*$/, '$1') : '');
    if (candidate && isOriginAllowed(candidate)) { done?.(); return; }

    logger.warn(`CSRF: rejecting ${method} ${url} from origin=${originHeader ?? '(none)'} referer=${refererHeader ?? '(none)'}`);
    reply.code(HttpStatus.FORBIDDEN).send({
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message: 'CSRF: request origin not allowed',
    });
  });
}

export function configureLoginRateLimit(app: NestFastifyApplication): void {
  const loginBucket = new Map<string, { count: number; resetAt: number }>();
  const LOGIN_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT ?? '5', 10);
  const LOGIN_TTL_MS = parseInt(process.env.LOGIN_TTL_MS ?? '60000', 10);
  const raw = app.getHttpAdapter().getInstance() as RawFastify;
  raw.addHook('onRequest', async (req: RawReq, reply: RawReply) => {
    if (req.method !== 'POST' || !req.url?.startsWith('/api/auth/login')) return;
    const fwd = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]?.trim()) ?? req.ip ?? 'unknown';
    const now = Date.now();
    let entry = loginBucket.get(ip);
    if (!entry || now > entry.resetAt) { entry = { count: 0, resetAt: now + LOGIN_TTL_MS }; loginBucket.set(ip, entry); }
    entry.count++;
    if (entry.count >= LOGIN_LIMIT) {
      const retryAfter = Math.ceil((entry.resetAt - now) / MS_PER_SECOND);
      reply.code(HttpStatus.TOO_MANY_REQUESTS).header('Retry-After', String(retryAfter))
        .send({ statusCode: HttpStatus.TOO_MANY_REQUESTS, error: 'Too Many Requests', message: `Login uchun juda ko'p urinish. ${retryAfter}s dan keyin qayta urinib ko'ring.` });
    }
    if (Math.random() < 0.01) {
      for (const [k, v] of loginBucket.entries()) {
        if (v.resetAt < now) loginBucket.delete(k);
      }
    }
  });
}

export function configureAppMiddleware(app: NestFastifyApplication): void {
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }, { path: 'api/health', method: RequestMethod.GET }],
  });
  const origins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const isDev = process.env.NODE_ENV !== 'production';
  const isReplitOrigin = (o: string) =>
    o.endsWith('.replit.dev') || o.endsWith('.repl.co') || o.endsWith('.replit.app');
  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) { cb(null, true); return; }
      if ((Array.isArray(origins) ? origins : []).some((a) => origin === a)) { cb(null, true); return; }
      if (isDev && isReplitOrigin(origin)) { cb(null, true); return; }
      cb(new Error(`CORS: origin '${origin}' ruxsat etilmagan`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'x-tg-session'],
  });
  app.useGlobalPipes(new ZodValidationPipe());
  // Sentry interceptor MUST be registered BEFORE GlobalExceptionFilter so the
  // exception is captured before the filter converts it into an HTTP response.
  app.useGlobalInterceptors(new SentryInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
}

export function configureSwagger(app: NestFastifyApplication, fastify: RawFastify, port: number, logger: Logger): void {
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
  logger.log(`Swagger UI: http://localhost:${port}/api/docs (secret required)`);
}

export function configureHealthRoutes(fastify: RawFastify): void {
  fastify.get('/', (_req, reply) => reply.code(200).send({ status: 'ok', service: 'europrint-api' }));
  fastify.get('/health', (_req, reply) => reply.code(200).send({ status: 'ok' }));
  fastify.get('/metrics', async (_req, reply) => {
    const metrics = await promRegister.metrics();
    reply.code(200).header('content-type', promRegister.contentType).send(metrics);
  });
}

/**
 * Register binary buffer content-type parsers (octet-stream, image, audio, video, pdf, *).
 */
export type CtParser = {
  addContentTypeParser: (
    ct: string | RegExp,
    opts: { parseAs: 'buffer' },
    fn: (req: unknown, body: Buffer, done: (e: Error | null, b: Buffer) => void) => void,
  ) => void;
};

export function registerBufferParsers(app: NestFastifyApplication): void {
  const fInst = app.getHttpAdapter().getInstance() as unknown as CtParser;
  const bufParser = (_req: unknown, body: Buffer, done: (e: Error | null, b: Buffer) => void) => done(null, body);
  fInst.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, bufParser);
  fInst.addContentTypeParser(/^image\//, { parseAs: 'buffer' }, bufParser);
  fInst.addContentTypeParser(/^audio\//, { parseAs: 'buffer' }, bufParser);
  fInst.addContentTypeParser(/^video\//, { parseAs: 'buffer' }, bufParser);
  fInst.addContentTypeParser('application/pdf', { parseAs: 'buffer' }, bufParser);
  fInst.addContentTypeParser('*', { parseAs: 'buffer' }, bufParser);
}
