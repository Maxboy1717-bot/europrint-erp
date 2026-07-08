/**
 * @module notification-schedules.controller
 * @description `notification_schedules` boshqaruvi — egasi/admin bildirishnoma-jadvallarini
 *   sozlaydi (ro'yxat / yaratish / tahrir / o'chirish). notification-schedule.cron shu
 *   jadvalni iste'mol qiladi. Zod validatsiya (Qoida 3) + Result unwrap (Qoida 1).
 * @layer Controller (Notifications)
 */
import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertOk } from '@common/http-result';
import { NotificationSchedulesRepository } from '../infrastructure/notification-schedules.repository';

const PriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

const CreateSchema = z.object({
  name:             z.string().min(1).max(200),
  notificationType: z.string().min(1).max(100),
  targetRole:       z.string().max(50).nullable().optional().transform(v => v ?? null),
  targetUserId:     z.number().int().positive().nullable().optional().transform(v => v ?? null),
  titleUz:          z.string().min(1).max(300),
  titleRu:          z.string().max(300).nullable().optional().transform(v => v ?? null),
  bodyUz:           z.string().min(1).max(2000),
  bodyRu:           z.string().max(2000).nullable().optional().transform(v => v ?? null),
  priority:         PriorityEnum.optional().transform(v => v ?? 'normal'),
  intervalHours:    z.number().int().min(1).max(8760),
  nextRunAt:        z.string().datetime().nullable().optional().transform(v => v ?? null),
}).refine(d => d.targetRole !== null || d.targetUserId !== null, {
  message: 'targetRole yoki targetUserId dan biri kerak',
});

const UpdateSchema = z.object({
  name:          z.string().min(1).max(200).optional(),
  titleUz:       z.string().min(1).max(300).optional(),
  titleRu:       z.string().max(300).optional(),
  bodyUz:        z.string().min(1).max(2000).optional(),
  bodyRu:        z.string().max(2000).optional(),
  priority:      PriorityEnum.optional(),
  intervalHours: z.number().int().min(1).max(8760).optional(),
  nextRunAt:     z.string().datetime().optional(),
  isActive:      z.boolean().optional(),
});

@ApiThrottle()
@ApiTags('Notification Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director')
@UseInterceptors(AuditInterceptor)
@Controller('notification-schedules')
export class NotificationSchedulesController {
  constructor(private readonly repo: NotificationSchedulesRepository) {}

  @ApiOperation({ summary: 'List notification schedules' })
  @Get()
  async list() {
    const r = await this.repo.list();
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Create notification schedule' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = CreateSchema.parse(body);
    const r = await this.repo.create(dto);
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Update notification schedule' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateSchema.parse(body);
    const r = await this.repo.update(Number(id), dto);
    assertOk(r);
    return { success: true };
  }

  @ApiOperation({ summary: 'Delete notification schedule' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const r = await this.repo.remove(Number(id));
    assertOk(r);
    return { success: true };
  }
}
