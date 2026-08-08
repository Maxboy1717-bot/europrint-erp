/**
 * @module diary.controller
 * @description NestJS controller for the director daily diary. Manager/director
 *   open and save their own daily entry; director lists across authors.
 */

import {
  Body,
  Controller,
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
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { DiaryService } from '../application/diary.service';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const DiaryOpenSchema = z.object({
  date: z.string().regex(DATE_RE).optional(),
});

const DiarySaveSchema = z.object({
  main_issue:    z.string().max(2000).nullish(),
  solution:      z.string().max(2000).nullish(),
  tomorrow_plan: z.string().max(2000).nullish(),
});

const DiaryListSchema = z.object({
  from:    z.string().regex(DATE_RE),
  to:      z.string().regex(DATE_RE),
  card_id: z.coerce.number().int().positive().optional(),
});

const MANAGER_ROLES = ['manager', 'director', 'super_admin'];
const DIRECTOR_ROLES = ['director', 'super_admin'];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

@ApiTags('Director — Diary')
@ApiBearerAuth()
@ApiThrottle()
@Controller('director/diary')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class DiaryController {
  private readonly logger = new Logger(DiaryController.name);

  constructor(private readonly svc: DiaryService) {}

  @Get('list')
  @Roles(...DIRECTOR_ROLES)
  @ApiOperation({ summary: 'Director list — diary entries across authors' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(@Query() q: unknown) {
    const dto = DiaryListSchema.parse(q);
    return { data: unwrapOrInternal(await this.svc.directorList(dto.from, dto.to, dto.card_id)) };
  }

  @Get()
  @ApiOperation({ summary: 'Open my diary for a date (auto-fill + carry-over)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async open(@Query() q: unknown, @CurrentUser() user: { id: number }) {
    const dto = DiaryOpenSchema.parse(q);
    const date = dto.date ?? todayStr();
    // Karta-markazli: muallif = foydalanuvchi egallagan org-karta (org_functions.id),
    // user.id emas. Karta topilmasa servis user.id ga fallback qiladi.
    return unwrapOrInternal(await this.svc.openDiaryForUser(user.id, date));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Save diary draft' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the entry owner' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async save(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: { id: number }) {
    const dto = DiarySaveSchema.parse(body);
    return unwrapOrInternal(
      await this.svc.saveDraft(parseInt(id, 10), {
        main_issue:    dto.main_issue ?? null,
        solution:      dto.solution ?? null,
        tomorrow_plan: dto.tomorrow_plan ?? null,
      }, user.id),
    );
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit diary entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the entry owner' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async submit(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return unwrapOrInternal(await this.svc.submitEntry(parseInt(id, 10), user.id));
  }
}
