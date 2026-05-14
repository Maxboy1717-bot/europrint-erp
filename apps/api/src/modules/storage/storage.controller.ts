/**
 * @module storage.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Put, Get, Query, Param, Req, Res, HttpCode,
  StreamableFile, Logger, NotFoundException,
} from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';
import type { FastifyRequest, FastifyReply } from 'fastify';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Type stub for the @fastify/multipart decoration on FastifyRequest
interface MultipartFile {
  toBuffer(): Promise<Buffer>;
}
interface MultipartRequest {
  file(): Promise<MultipartFile | undefined>;
}

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
  @Public()
  @Put('upload')
  @HttpCode(200)
  async uploadFile(
    @Query('key') key: string,
    @Query('mime') mime: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (!key) return res.status(400).send({ error: 'Missing key' });

    const safePath = path.join(UPLOADS_DIR, key.replace(/\.\./g, '_'));
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

    fs.writeFileSync(safePath, body);
    this.logger.log(`Stored: ${key} (${body.length} bytes, ${mime})`);
    return res.status(200).send({ ok: true, key, size: body.length });
  }

  /** GET /storage/chat/1/file/xxx.png */
  @Public()
  @Get('*')
  async serveFile(
    @Param('*') filePath: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    const safePath = path.join(UPLOADS_DIR, filePath.replace(/\.\./g, '_'));
    if (!fs.existsSync(safePath)) {
      throw new NotFoundException('File not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'audio/ogg',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    const contentType = mimeMap[ext] ?? 'application/octet-stream';
    (res as unknown as { header: (k: string, v: string) => void }).header('Content-Type', contentType);
    (res as unknown as { header: (k: string, v: string) => void }).header('Cache-Control', 'public, max-age=86400');
    return new StreamableFile(fs.createReadStream(safePath));
  }
}
