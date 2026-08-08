/**
 * @module coordination-docs.controller
 * @description Приказ (prikaz) + Протокол (protocol) HTTP boshqaruvi — modul 04 Coordination.
 *   Imzo/bekor/tuzatish oqimlari. Zod (Qoida 3) + Result unwrap (Qoida 1) + guard.
 * @layer Controller (Director / Coordination)
 */
import {
  Body, Controller, Get, Param, Patch, Post, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertOk } from '@common/http-result';
import { PrikazRepository } from '../infrastructure/repositories/prikaz.repository';
import { ProtocolRepository } from '../infrastructure/repositories/protocol.repository';

const nz = <T extends z.ZodTypeAny>(s: T) => s.nullable().optional().transform(v => v ?? null);

const PrikazCreate = z.object({
  title:        z.string().min(1).max(300),
  content:      nz(z.string().max(20000)),
  supersedesId: nz(z.number().int().positive()),
});
const PrikazUpdate = z.object({
  title:   z.string().min(1).max(300).optional(),
  content: z.string().max(20000).optional(),
});
const CancelSchema = z.object({ reason: z.string().min(1).max(1000) });

const ProtocolCreate = z.object({
  councilId:         nz(z.number().int().positive()),
  title:             z.string().min(1).max(300),
  agenda:            nz(z.string().max(20000)),
  decisions:         nz(z.string().max(20000)),
  chairpersonId:     nz(z.number().int().positive()),
  secretaryId:       nz(z.number().int().positive()),
  dissentingOpinion: z.any().nullable().optional().transform(v => v ?? null),
});

@ApiThrottle()
@ApiTags('Coordination — Prikaz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'ceo')
@UseInterceptors(AuditInterceptor)
@Controller('prikaz')
export class PrikazController {
  constructor(private readonly repo: PrikazRepository) {}

  @ApiOperation({ summary: 'List prikaz' })
  @Get()
  async list() { const r = await this.repo.list(); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Get prikaz' })
  @Get(':id')
  async get(@Param('id') id: string) { const r = await this.repo.getById(Number(id)); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Create prikaz draft' })
  @Post()
  async create(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const d = PrikazCreate.parse(body);
    const r = await this.repo.create({ title: d.title, content: d.content, issuedBy: Number(user.id), supersedesId: d.supersedesId });
    assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Update prikaz draft (immutable after sign)' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const d = PrikazUpdate.parse(body);
    const r = await this.repo.updateDraft(Number(id), d); assertOk(r); return { success: true };
  }

  @ApiOperation({ summary: 'Sign prikaz (assigns number, becomes immutable)' })
  @Post(':id/sign')
  async sign(@Param('id') id: string) { const r = await this.repo.sign(Number(id)); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Cancel prikaz' })
  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Body() body: unknown) {
    const d = CancelSchema.parse(body);
    const r = await this.repo.cancel(Number(id), d.reason); assertOk(r); return { success: true };
  }
}

@ApiThrottle()
@ApiTags('Coordination — Protocol')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director', 'ceo', 'manager')
@UseInterceptors(AuditInterceptor)
@Controller('protocols')
export class ProtocolController {
  constructor(private readonly repo: ProtocolRepository) {}

  @ApiOperation({ summary: 'List protocols' })
  @Get()
  async list() { const r = await this.repo.list(); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Get protocol' })
  @Get(':id')
  async get(@Param('id') id: string) { const r = await this.repo.getById(Number(id)); assertOk(r); return r.data; }

  @ApiOperation({ summary: 'Create protocol draft' })
  @Post()
  async create(@Body() body: unknown) {
    const d = ProtocolCreate.parse(body);
    const r = await this.repo.create(d); assertOk(r); return r.data;
  }

  @ApiOperation({ summary: 'Update protocol draft (immutable after sign)' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const d = ProtocolCreate.partial().parse(body);
    const r = await this.repo.updateDraft(Number(id), d); assertOk(r); return { success: true };
  }

  @ApiOperation({ summary: 'Sign protocol' })
  @Post(':id/sign')
  async sign(@Param('id') id: string) { const r = await this.repo.sign(Number(id)); assertOk(r); return { success: true }; }

  @ApiOperation({ summary: 'Amend signed protocol (new correction protocol)' })
  @Post(':id/amend')
  async amend(@Param('id') id: string, @Body() body: unknown) {
    const d = ProtocolCreate.parse(body);
    const r = await this.repo.amend(Number(id), d); assertOk(r); return r.data;
  }
}
