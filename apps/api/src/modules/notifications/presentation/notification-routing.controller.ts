/**
 * @module notification-routing.controller
 * @description `notification_routing_rules` boshqaruvi — egasi/admin "qaysi hodisa kimga
 *   (rol/xodim) borishi"ni sozlaydi (ro'yxat / yaratish / tahrir / o'chirish).
 *   Vizyon EP-NTF-079 (hodisa→lavozim→kanal yagona marshrut-jadvali). Zod validatsiya
 *   (Qoida 3) + Result unwrap (Qoida 1).
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
import { NotificationRoutingRepository } from '../infrastructure/notification-routing.repository';

const CreateSchema = z.object({
  eventType:    z.string().min(1).max(100),
  targetRole:   z.string().max(50).nullable().optional().transform(v => v ?? null),
  targetUserId: z.number().int().positive().nullable().optional().transform(v => v ?? null),
  notes:        z.string().max(500).nullable().optional().transform(v => v ?? null),
}).refine(d => d.targetRole !== null || d.targetUserId !== null, {
  message: 'targetRole yoki targetUserId dan biri kerak',
});

const UpdateSchema = z.object({
  targetRole:   z.string().max(50).nullable().optional(),
  targetUserId: z.number().int().positive().nullable().optional(),
  notes:        z.string().max(500).nullable().optional(),
  isActive:     z.boolean().optional(),
});

@ApiThrottle()
@ApiTags('Notification Routing Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'super_admin', 'director')
@UseInterceptors(AuditInterceptor)
@Controller('notification-routing-rules')
export class NotificationRoutingController {
  constructor(private readonly repo: NotificationRoutingRepository) {}

  @ApiOperation({ summary: 'List event -> target (role/user) routing rules' })
  @Get()
  async list() {
    const r = await this.repo.list();
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Create a routing rule' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = CreateSchema.parse(body);
    const r = await this.repo.create(dto);
    assertOk(r);
    return r.data;
  }

  @ApiOperation({ summary: 'Update a routing rule' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateSchema.parse(body);
    const r = await this.repo.update(Number(id), dto);
    assertOk(r);
    return { success: true };
  }

  @ApiOperation({ summary: 'Delete a routing rule' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const r = await this.repo.remove(Number(id));
    assertOk(r);
    return { success: true };
  }
}
