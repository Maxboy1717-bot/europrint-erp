/**
 * @module stat-regulation.controller
 * @description NestJS controller for director stat-regulations (versioned KPI
 *   master-data). Delegates to StatRegulationService; Zod-validated bodies.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal, unwrapOrNotFoundDefined } from '@common/http-result';
import { StatRegulationService } from '../application/stat-regulation.service';

const StatRegCreateSchema = z.object({
  name_uz:       z.string().min(1).max(200),
  name_ru:       z.string().max(200).nullish(),
  definition:    z.string().max(2000).nullish(),
  formula:       z.string().max(500).nullish(),
  unit:          z.string().max(50).nullish(),
  frequency:     z.enum(['daily', 'weekly', 'monthly']),
  source_module: z.string().max(50).nullish(),
  owner_card_id: z.coerce.number().int().positive().nullish(),
  target_value:  z.coerce.number().positive().nullish(),
});
type StatRegCreateBody = z.infer<typeof StatRegCreateSchema>;

const StatRegUpdateSchema = StatRegCreateSchema.partial();
type StatRegUpdateBody = z.infer<typeof StatRegUpdateSchema>;

const StatRegApproveSchema = z.object({
  approver_card_id: z.coerce.number().int().positive(),
});
type StatRegApproveBody = z.infer<typeof StatRegApproveSchema>;

const DIRECTOR_ROLES = ['director', 'super_admin'];

/** Numeric target_value DB ustuni TEXT/NUMERIC sifatida saqlanadi (string). */
function toTargetString(v: number | null | undefined): string | null {
  return v == null ? null : String(v);
}

@ApiTags('Director — Stat Regulations')
@ApiBearerAuth()
@ApiThrottle()
@Controller('director/stat-regulations')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...DIRECTOR_ROLES)
export class StatRegulationController {
  private readonly logger = new Logger(StatRegulationController.name);

  constructor(
    private readonly svc: StatRegulationService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List stat-regulations (active by default)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query('active_only') activeOnly?: string) {
    const ao = activeOnly !== 'false';
    return { data: unwrapOrInternal(await this.svc.list(ao)) };
  }

  @Get('history')
  @ApiOperation({ summary: 'Version history of a stat-regulation by name' })
  @ApiResponse({ status: 200, description: 'OK' })
  async history(@Query('name') name?: string) {
    if (!name) throw new BadRequestException(await this.i18n.t('validation.nameRequired'));
    return { data: unwrapOrInternal(await this.svc.getHistory(name)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one stat-regulation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getOne(@Param('id') id: string) {
    return unwrapOrNotFoundDefined(await this.svc.getById(parseInt(id, 10)), 'Topilmadi');
  }

  @Post()
  @ApiOperation({ summary: 'Create stat-regulation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() body: unknown) {
    const dto: StatRegCreateBody = StatRegCreateSchema.parse(body);
    return unwrapOrInternal(
      await this.svc.create({
        name_uz:       dto.name_uz,
        name_ru:       dto.name_ru ?? null,
        definition:    dto.definition ?? null,
        formula:       dto.formula ?? null,
        unit:          dto.unit ?? null,
        frequency:     dto.frequency,
        source_module: dto.source_module ?? null,
        owner_card_id: dto.owner_card_id ?? null,
        target_value:  toTargetString(dto.target_value),
      }),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update stat-regulation (creates a new version)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto: StatRegUpdateBody = StatRegUpdateSchema.parse(body);
    return unwrapOrInternal(
      await this.svc.update(parseInt(id, 10), {
        name_uz:       dto.name_uz,
        name_ru:       dto.name_ru ?? undefined,
        definition:    dto.definition ?? undefined,
        formula:       dto.formula ?? undefined,
        unit:          dto.unit ?? undefined,
        frequency:     dto.frequency,
        source_module: dto.source_module ?? undefined,
        owner_card_id: dto.owner_card_id ?? undefined,
        target_value:  dto.target_value == null ? undefined : String(dto.target_value),
      }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate stat-regulation' })
  @ApiResponse({ status: 200, description: 'OK' })
  async deactivate(@Param('id') id: string) {
    unwrapOrInternal(await this.svc.deactivate(parseInt(id, 10)));
    return { message: "O'chirildi" };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve / sign-off the current version of a stat-regulation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async approve(@Param('id') id: string, @Body() body: unknown) {
    const dto: StatRegApproveBody = StatRegApproveSchema.parse(body);
    return unwrapOrInternal(await this.svc.approve(parseInt(id, 10), dto.approver_card_id));
  }
}
