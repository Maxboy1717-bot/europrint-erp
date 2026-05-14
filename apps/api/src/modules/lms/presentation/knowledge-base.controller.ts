/**
 * @module knowledge-base.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put,
  Query, Req, UseGuards, UseInterceptors, UsePipes, HttpStatus } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('knowledge-base')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class KnowledgeBaseController {
  constructor(private readonly svc: KnowledgeBaseService) {}

  @Get()
  @Roles(...KB_ROLES)
  async list(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return unwrapOrInternal(await this.svc.findAll(category, search));
  }

  @Get(':id')
  @Roles(...KB_ROLES)
  async findOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.findById(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(...KB_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(CreateKnowledgeBaseSchema))
  async create(@Body() body: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.create(body));
  }

  @Put(':id')
  @Roles(...KB_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateKnowledgeBaseSchema))
  async replace(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.update(id, body));
  }

  @Patch(':id')
  @Roles(...KB_ADMIN_ROLES)
  @UsePipes(new ZodValidationPipe(UpdateKnowledgeBaseSchema))
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.update(id, body));
  }

  @Delete(':id')
  @Roles(...KB_ADMIN_ROLES)
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.remove(id));
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...KB_ADMIN_ROLES)
  async uploadFile(@Req() req: FastifyRequest & { file(): Promise<{ filename: string; mimetype: string; fields: Record<string, unknown>; toBuffer(): Promise<Buffer> } | null> }) {
    const data = await req.file();
    const fields = (data?.fields ?? {}) as Record<string, MultipartValue>;
    const title    = 'value' in (fields['title']    ?? {}) ? String((fields['title']    as { value: string }).value) : '';
    const titleRu  = 'value' in (fields['titleRu']  ?? {}) ? String((fields['titleRu']  as { value: string }).value) : '';
    const category = 'value' in (fields['category'] ?? {}) ? String((fields['category'] as { value: string }).value) : 'other';
    await data?.toBuffer();
    return data
      ? this.svc.uploadFile(title, titleRu, category, data.filename)
      : { ok: false, message: 'No file provided' };
  }
}
