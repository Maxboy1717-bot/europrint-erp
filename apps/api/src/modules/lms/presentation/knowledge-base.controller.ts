/**
 * @module knowledge-base.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put,
  Query, Req, UseGuards, UseInterceptors, UsePipes, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import * as path from 'path';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  KnowledgeBaseService,
  CreateKnowledgeBaseSchema,
  UpdateKnowledgeBaseSchema,
} from '../application/services/knowledge-base.service';
import { unwrapOrInternal } from '@common/http-result';

const KB_ROLES       = ['admin', 'super_admin', 'hr_manager', 'lms_manager', 'manager', 'director', 'employee'] as const;
const KB_ADMIN_ROLES = ['admin', 'super_admin', 'hr_manager', 'lms_manager', 'manager', 'director'] as const;

type MultipartValue = { value: string } | { filename: string; mimetype: string; _buf?: Buffer };

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_UPLOAD_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.pdf', '.docx', '.xlsx', '.csv', '.txt',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
]);

@ApiThrottle()
@ApiTags('Knowledge Base')
@ApiBearerAuth()
@Controller('knowledge-base')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class KnowledgeBaseController {
  constructor(private readonly svc: KnowledgeBaseService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...KB_ROLES)
  async list(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return unwrapOrInternal(await this.svc.findAll(category, search));
  }

  @ApiOperation({ summary: 'Find one' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(...KB_ROLES)
  async findOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.findById(id));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(...KB_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateKnowledgeBaseSchema))
  async create(@Body() body: unknown) {
    return unwrapOrInternal(await this.svc.create(body as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Replace' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles(...KB_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateKnowledgeBaseSchema))
  async replace(@Param('id') id: string, @Body() body: unknown) {
    return unwrapOrInternal(await this.svc.update(id, body as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles(...KB_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateKnowledgeBaseSchema))
  async update(@Param('id') id: string, @Body() body: unknown) {
    return unwrapOrInternal(await this.svc.update(id, body as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Remove' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles(...KB_ADMIN_ROLES)
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.remove(id));
  }

  @ApiOperation({ summary: 'Upload file' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...KB_ADMIN_ROLES)
  async uploadFile(@Req() req: FastifyRequest & { file(): Promise<{ filename: string; mimetype: string; fields: Record<string, unknown>; toBuffer(): Promise<Buffer> } | null> }) {
    const data = await req.file();
    if (data) {
      const ext = path.extname(data.filename).toLowerCase();
      if (!ALLOWED_UPLOAD_EXT.has(ext)) {
        throw new BadRequestException(`File type not allowed: ${ext || '(none)'}`);
      }
    }
    const fields = (data?.fields ?? {}) as Record<string, MultipartValue>;
    const title    = 'value' in (fields['title']    ?? {}) ? String((fields['title']    as { value: string }).value) : '';
    const titleRu  = 'value' in (fields['titleRu']  ?? {}) ? String((fields['titleRu']  as { value: string }).value) : '';
    const category = 'value' in (fields['category'] ?? {}) ? String((fields['category'] as { value: string }).value) : 'other';
    const buf = await data?.toBuffer();
    if (buf && buf.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File too large');
    }
    return data
      ? this.svc.uploadFile(title, titleRu, category, data.filename)
      : { ok: false, message: 'No file provided' };
  }
}
