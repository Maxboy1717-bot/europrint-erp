/**
 * @module nda.controller
 * @description Tijorat siri NDA imzolari boshqaruvi — modul 02 HR (02.41).
 *   NDA berish (HR) / imzolash (xodim) / ro'yxat / o'chirish. Zod (Qoida 3) + Result (Qoida 1).
 * @layer Controller (HR / NDA)
 */
import {
  Body, Controller, Delete, Get, Param, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertOk } from '@common/http-result';
import { NdaRepository } from './nda.repository';

const IssueSchema = z.object({
  userId:          z.number().int().positive(),
  documentTitle:   z.string().max(300).nullable().optional().transform(v => v ?? null),
  documentVersion: z.string().max(50).optional().transform(v => v ?? 'v1'),
});
const SignSchema = z.object({
  notes: z.string().max(2000).nullable().optional().transform(v => v ?? null),
});

@ApiThrottle()
@ApiTags('HR — NDA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'manager', 'hr_manager', 'employee', 'operator')
@UseInterceptors(AuditInterceptor)
@Controller('hr/nda')
export class NdaController {
  constructor(private readonly repo: NdaRepository) {}

  @ApiOperation({ summary: 'List NDA acknowledgments (?userId, ?pending=true)' })
  @Get()
  async list(@Query('userId') userId?: string, @Query('pending') pending?: string | boolean) {
    const r = await this.repo.list(userId ? Number(userId) : null, String(pending) === 'true');
    assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Get NDA' })
  @Get(':id')
  async get(@Param('id') id: string) { const r = await this.repo.getById(Number(id)); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Issue NDA to employee (HR)' })
  @Roles('admin', 'super_admin', 'director', 'manager', 'hr_manager')
  @Post()
  async issue(@Body() body: unknown) {
    const d = IssueSchema.parse(body);
    const r = await this.repo.issue(d.userId, d.documentTitle, d.documentVersion);
    assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Sign NDA (employee acknowledges)' })
  @Post(':id/sign')
  async sign(@Param('id') id: string, @Body() body: unknown) {
    const d = SignSchema.parse(body);
    const r = await this.repo.sign(Number(id), d.notes);
    assertOk(r); return { success: true };
  }

  @ApiOperation({ summary: 'Delete NDA' })
  @Roles('admin', 'super_admin', 'hr_manager')
  @Delete(':id')
  async remove(@Param('id') id: string) { const r = await this.repo.remove(Number(id)); assertOk(r); return { success: true }; }
}
