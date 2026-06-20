/**
 * @module coordination.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { CoordinationService } from '../application/coordination.service';
import {
  CoordinationCreateDoklaSchema, CoordinationCreateDoklaDto,
  CoordinationUpdateDoklaSchema, CoordinationUpdateDoklaDto,
  CoordinationUpdateRaspSchema, CoordinationUpdateRaspDto,
  CoordinationMarkDoneSchema, CoordinationMarkDoneDto,
  CoordinationCreateRaspSchema, CoordinationCreateRaspDto,
} from './dto/director.dto';


@ApiThrottle()
@ApiTags('Coordination')
@Controller('coordination')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('admin', 'manager', 'supervisor', 'director', 'ceo')
export class CoordinationController {
  private readonly logger = new Logger(CoordinationController.name);

  constructor(private readonly svc: CoordinationService) {}

  @ApiOperation({ summary: 'Get councils' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('councils')
  async getCouncils() {
    const r = await db.execute(sql`
      SELECT c.id, c.name, c.council_type, c.description, c.is_active, c.created_at,
             TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS chairperson_name,
             c.meeting_schedule
      FROM councils c
      LEFT JOIN users u ON u.id = c.chairperson_id
      WHERE c.is_active = true ORDER BY c.id
    `);
    return ((r as { rows?: unknown[] }).rows) ?? [];
  }

  @ApiOperation({ summary: 'Get baskets' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('baskets')
  async getBaskets() {
    return unwrapOrInternal(await this.svc.getBaskets());
  }

  @ApiOperation({ summary: 'Create dokla' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('dokla')
  @UsePipes(new ZodValidationPipe(CoordinationCreateDoklaSchema))
  async createDokla(
    @Body() body: CoordinationCreateDoklaDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.createDoklaWithValidation(user.id, body));
  }

  @ApiOperation({ summary: 'List dokla' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dokla')
  async listDokla() {
    return unwrapOrInternal(await this.svc.listDokla());
  }

  @ApiOperation({ summary: 'Update dokla' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('dokla/:id')
  @UsePipes(new ZodValidationPipe(CoordinationUpdateDoklaSchema))
  async updateDokla(
    @Param('id') id: string,
    @Body() body: CoordinationUpdateDoklaDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    const { status } = body as Record<string, string>;
    return unwrapOrThrow(await this.svc.updateDoklaWithAuth(parseInt(id, 10), user.id, user.role, status ?? null));
  }

  @ApiOperation({ summary: 'Delete dokla' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('dokla/:id')
  async deleteDokla(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.deleteDoklaWithAuth(parseInt(id, 10), user.id, user.role));
  }

  @ApiOperation({ summary: 'Create rasporyazhenie' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rasporyazhenie')
  @UsePipes(new ZodValidationPipe(CoordinationCreateRaspSchema))
  async createRasporyazhenie(
    @Body() body: CoordinationCreateRaspDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.createRaspWithValidation(user.id, body));
  }

  @ApiOperation({ summary: 'List rasporyazhenie' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rasporyazhenie')
  async listRasporyazhenie() {
    return unwrapOrInternal(await this.svc.listRasporyazhenie());
  }

  @ApiOperation({ summary: 'Mark done' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('rasporyazhenie/:id/done')
  @UsePipes(new ZodValidationPipe(CoordinationMarkDoneSchema))
  async markDone(
    @Param('id') id: string,
    @Body() body: CoordinationMarkDoneDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.markRaspDoneWithAuth(parseInt(id, 10), user.id, user.role, (body.note as string) ?? null));
  }

  @ApiOperation({ summary: 'Mark dokla read' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('dokla/:id/read')
  async markDoklaRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.updateDoklaWithAuth(parseInt(id, 10), user.id, user.role, 'read'));
  }

  @ApiOperation({ summary: 'Mark dokla resolved' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('dokla/:id/resolved')
  async markDoklaResolved(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.updateDoklaWithAuth(parseInt(id, 10), user.id, user.role, 'resolved'));
  }

  @ApiOperation({ summary: 'Update rasporyazhenie' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('rasporyazhenie/:id')
  @UsePipes(new ZodValidationPipe(CoordinationUpdateRaspSchema))
  async updateRasporyazhenie(
    @Param('id') id: string,
    @Body() body: CoordinationUpdateRaspDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    const { status } = body as Record<string, string>;
    return unwrapOrThrow(await this.svc.updateRaspWithAuth(parseInt(id, 10), user.id, user.role, status ?? null));
  }

  @ApiOperation({ summary: 'Delete rasporyazhenie' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('rasporyazhenie/:id')
  async deleteRasporyazhenie(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrThrow(await this.svc.deleteRaspWithAuth(parseInt(id, 10), user.id, user.role));
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }

  @ApiOperation({ summary: 'List users for assignee picker (id + full_name)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('users-for-select')
  async usersForSelect() {
    const r = await db.execute(sql`
      SELECT
        id,
        TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) AS full_name,
        role
      FROM users
      WHERE (is_active = true OR is_active IS NULL)
        AND TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) <> ''
      ORDER BY first_name, last_name
      LIMIT 200
    `);
    return ((r as { rows?: unknown[] }).rows) ?? [];
  }
}
