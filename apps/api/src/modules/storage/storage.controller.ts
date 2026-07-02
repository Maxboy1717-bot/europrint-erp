/**
 * @module storage.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Put, Get, Query, Param, Req, Res, HttpCode,
  StreamableFile, Logger, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@shared/db';
import { auditLogs as auditLogsTable } from '@shared/db/schema-rbac';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_UPLOAD_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.pdf', '.docx', '.xlsx', '.csv', '.txt',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
]);

// APPROVED: egasi vizyon-qurish 2026-07-01, FAZA O (ERP Office uslubi) — no new table,
// reuses existing `audit_logs` (schema-rbac.ts auditLogs) for the reason-log.
//
// Roles allowed to force-download (Content-Disposition: attachment) a stored file.
// Mirrors the system-level bypass set already used by RolesGuard/PermissionGuard
// (super_admin/admin/director always pass) + 'manager'. 'employee' and any other
// role is DENIED — they can still view IMAGE/media files inline (GET /storage/*)
// but cannot force a save-to-disk download; DOCUMENT types (see
// GATED_DOC_EXTENSIONS) are role-gated even for inline viewing.
const DOWNLOAD_ALLOWED_ROLES = new Set(['super_admin', 'admin', 'director', 'manager']);

// Hujjat-eksport-cheklash (G7, egasi 2026-07-02): document types are role-gated on
// BOTH routes (inline serve + force-download with a mandatory user reason).
// image/* stays open on the inline route so <img>/preview UI keeps working (Q-39);
// chat image force-download (ImageLightbox) also stays reason-free for the same
// reason — only DOCUMENTS require a typed justification.
const GATED_DOC_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.csv']);

// Foydalanuvchi yuklab-olish sababi: kamida 5 belgi (bo'sh joylardan tashqari).
const DownloadReasonSchema = z.string().trim().min(5).max(500);

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'audio/ogg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** Best-effort reason-log write to `audit_logs` — never throws (logging must not
 *  break the request pipeline, same contract as AuditInterceptor). */
async function logDownloadAttempt(params: {
  filePath: string;
  allowed: boolean;
  reason: string;
  user?: AuthenticatedUser;
  /** Default DOWNLOAD_*; inline-view denials pass their own action label. */
  action?: string;
}): Promise<void> {
  const { filePath, allowed, reason, user, action } = params;
  try {
    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      tableName: 'storage_download',
      recordId: filePath,
      action: action ?? (allowed ? 'DOWNLOAD_ALLOWED' : 'DOWNLOAD_DENIED'),
      reason,
      userId: user?.id != null ? String(user.id) : undefined,
      userFullName: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined : undefined,
      userRole: user?.role,
    });
  } catch (e) {
    Logger.warn(`Download reason-log write failed: ${String(e)}`, 'StorageController');
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Resolve a user-supplied key/path strictly inside UPLOADS_DIR. Returns null on any
 * traversal attempt (absolute paths, `..`, symlink-style escapes). Uses path.resolve +
 * prefix assertion rather than a naive `..` string replace (which `....//` etc. bypass).
 */
function resolveWithinUploads(key: string): string | null {
  const resolved = path.resolve(UPLOADS_DIR, key);
  if (resolved !== UPLOADS_DIR && !resolved.startsWith(UPLOADS_DIR + path.sep)) return null;
  return resolved;
}

// Type stub for the @fastify/multipart decoration on FastifyRequest
interface MultipartFile {
  toBuffer(): Promise<Buffer>;
}
interface MultipartRequest {
  file(): Promise<MultipartFile | undefined>;
}

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  /**
   * PUT /storage/upload?key=chat/1/file/xxx.png&mime=image/png
   *
   * Accepts two body formats:
   *   1. multipart/form-data  — file in the "file" field (used by browser FormData)
   *   2. raw binary           — body populated by the '*' content-type parser in main.ts
   *      (fallback for direct binary PUT when the server has been restarted)
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload file (authenticated)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('upload')
  @HttpCode(200)
  async uploadFile(
    @Query('key') key: string,
    @Query('mime') mime: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!key) return res.status(400).send({ error: 'Missing key' });

    // Path-traversal hardening: resolve strictly inside UPLOADS_DIR.
    const safePath = resolveWithinUploads(key);
    if (!safePath) return res.status(400).send({ error: 'Invalid key' });

    // Extension allowlist — block executable/script uploads served from our origin.
    const ext = path.extname(key).toLowerCase();
    if (!ALLOWED_UPLOAD_EXT.has(ext)) {
      return res.status(400).send({ error: `File type not allowed: ${ext || '(none)'}` });
    }
    ensureDir(path.dirname(safePath));

    let body: Buffer;
    const contentType = (req.headers['content-type'] ?? '') as string;

    if (contentType.includes('multipart/form-data')) {
      // @fastify/multipart is registered globally — use its req.file() API
      const mp = await (req as unknown as MultipartRequest).file();
      body = mp ? await mp.toBuffer() : Buffer.alloc(0);
    } else {
      // Fallback: raw body from the '*' content-type parser (requires server restart)
      const rawBody = (req as unknown as { body: unknown }).body;
      body = Buffer.isBuffer(rawBody)
        ? rawBody
        : typeof rawBody === 'string'
          ? Buffer.from(rawBody, 'utf8')
          : Buffer.alloc(0);
    }

    if (body.length === 0) {
      this.logger.warn(`Empty body for key=${key} content-type=${contentType}`);
      return res.status(400).send({ error: 'Empty file body' });
    }
    if (body.length > MAX_UPLOAD_BYTES) {
      return res.status(400).send({ error: 'File too large' });
    }

    fs.writeFileSync(safePath, body);
    this.logger.log(`Stored: ${key} (${body.length} bytes, ${mime})`);
    return res.status(200).send({ ok: true, key, size: body.length });
  }

  /**
   * GET /storage/download/chat/1/file/xxx.pdf?reason=... — restricted force-download.
   *
   * Sets `Content-Disposition: attachment` and gates access to
   * `DOWNLOAD_ALLOWED_ROLES`. DOCUMENT types (GATED_DOC_EXTENSIONS) additionally
   * REQUIRE a user-typed `?reason=` (min 5 chars → 400 otherwise); images/media stay
   * reason-free so chat ImageLightbox keeps working (Q-39). Every attempt (allowed
   * or denied) is written to `audit_logs` with the USER-TYPED reason + role (falls
   * back to a server-generated text when no reason was supplied for non-documents)
   * — the guard-based approach (`@Roles` + `RolesGuard`) throws before any handler
   * code runs, so it cannot log a per-file reason; this manual check runs the log
   * write on both outcomes first.
   *
   * NOTE: registered BEFORE the `@Get('*')` wildcard below so `download/*` is matched
   * here and not swallowed by the catch-all inline route.
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download file — role-gated, user reason required for documents, logged (authenticated)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request — document download requires ?reason= (min 5 chars)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — role not allowed to download' })
  @Get('download/*')
  async downloadFile(
    @Param('*') filePath: string,
    @Query('reason') reasonRaw: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    const safePath = resolveWithinUploads(filePath);
    if (!safePath || !fs.existsSync(safePath)) {
      throw new NotFoundException('File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const isGatedDoc = GATED_DOC_EXTENSIONS.has(ext);

    // Foydalanuvchi-sabab: hujjat tiplari uchun MAJBURIY (min 5 belgi), boshqa
    // tiplar (rasm/media — chat ImageLightbox) uchun ixtiyoriy, bo'lsa loglanadi.
    const parsedReason = DownloadReasonSchema.safeParse(reasonRaw ?? '');
    if (isGatedDoc && !parsedReason.success) {
      throw new BadRequestException(
        "Hujjatni yuklab olish uchun sabab kiritilishi shart (?reason=, kamida 5 belgi)",
      );
    }
    const userReason = parsedReason.success ? parsedReason.data : null;

    const roleLower = (user?.role ?? '').toLowerCase();
    const allowed = DOWNLOAD_ALLOWED_ROLES.has(roleLower);
    const roleLabel = user?.role ?? 'noma\'lum';
    const reason = allowed
      ? (userReason
          ? `Foydalanuvchi sababi: "${userReason}" — rol "${roleLabel}" (ruxsat berildi)`
          : `Ruxsat berildi: rol "${roleLabel}" fayl yuklab olishga huquqli`)
      : (userReason
          ? `Rad etildi: rol "${roleLabel}" huquqsiz (faqat ${[...DOWNLOAD_ALLOWED_ROLES].join(', ')}). Foydalanuvchi sababi: "${userReason}"`
          : `Rad etildi: rol "${roleLabel}" fayl yuklab olish huquqiga ega emas (faqat ${[...DOWNLOAD_ALLOWED_ROLES].join(', ')})`);

    await logDownloadAttempt({ filePath, allowed, reason, user });

    if (!allowed) {
      throw new ForbiddenException(reason);
    }

    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';
    const fastifyRes = res as unknown as { header: (k: string, v: string) => void };
    fastifyRes.header('Content-Type', contentType);
    fastifyRes.header('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    return new StreamableFile(fs.createReadStream(safePath));
  }

  /** GET /storage/chat/1/file/xxx.png — authenticated (browser sends the access_token cookie
   *  automatically on same-origin <img>/fetch, so logged-in users still load chat/wms files;
   *  anonymous callers now get 401 from the global JwtAuthGuard). Inline serving of
   *  image/media types stays role-UNRESTRICTED — it backs office-style preview
   *  (<img> rendering, Q-39). DOCUMENT types (GATED_DOC_EXTENSIONS: pdf/docx/xlsx/csv)
   *  are gated to DOWNLOAD_ALLOWED_ROLES (hujjat-eksport-cheklash, egasi 2026-07-02);
   *  denied document attempts are audit-logged. */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Serve file inline — documents role-gated, images open (authenticated)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — role not allowed to view documents' })
  @Get('*')
  async serveFile(
    @Param('*') filePath: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    const safePath = resolveWithinUploads(filePath);
    if (!safePath || !fs.existsSync(safePath)) {
      throw new NotFoundException('File not found');
    }
    const ext = path.extname(filePath).toLowerCase();

    // Hujjat tiplari (pdf/docx/xlsx/csv) inline ko'rishda ham rol-gate ostida;
    // image/* va media OCHIQ qoladi (UI preview buzilmasin — Q-39).
    if (GATED_DOC_EXTENSIONS.has(ext)) {
      const roleLower = (user?.role ?? '').toLowerCase();
      if (!DOWNLOAD_ALLOWED_ROLES.has(roleLower)) {
        const reason = `Rad etildi (inline hujjat): rol "${user?.role ?? 'noma\'lum'}" hujjat ko'rish/yuklab olish huquqiga ega emas (faqat ${[...DOWNLOAD_ALLOWED_ROLES].join(', ')})`;
        await logDownloadAttempt({ filePath, allowed: false, reason, user, action: 'INLINE_VIEW_DENIED' });
        throw new ForbiddenException(reason);
      }
    }
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';
    (res as unknown as { header: (k: string, v: string) => void }).header('Content-Type', contentType);
    (res as unknown as { header: (k: string, v: string) => void }).header('Cache-Control', 'public, max-age=86400');
    return new StreamableFile(fs.createReadStream(safePath));
  }
}
