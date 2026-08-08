/**
 * @module mes-crew-members.controller
 * @description NestJS controller (08-mes #83). 1 operator + N nomli yordamchi
 * + hissa% CRUD for a production session's machine crew. Delegates to service;
 * returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, UseInterceptors,
  Logger, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { MesCrewMembersService } from '../application/mes-crew-members.service';
import { safeInt } from '../../hr/common/db-rows';

const MES_ROLES = ['super_admin', 'director', 'production_manager', 'operator', 'technologist'];

const AddCrewMemberSchema = z.object({
  sessionId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  roleLabel: z.string().min(1).max(60).nullish(),
  sharePercent: z.number().min(0).max(100).nullish(),
});
type AddCrewMemberDto = z.infer<typeof AddCrewMemberSchema>;

@ApiThrottle()
@ApiBearerAuth()
@UseInterceptors(AuditInterceptor)
@ApiTags('Mes Crew Members')
@Controller('mes/crew-members')
@UseGuards(RolesGuard)
@Roles(...MES_ROLES)
export class MesCrewMembersController {
  private readonly logger = new Logger(MesCrewMembersController.name);

  constructor(private readonly svc: MesCrewMembersService) {}

  @ApiOperation({ summary: 'List crew members (with computed contribution %) for a session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('session/:sessionId')
  async listForSession(@Param('sessionId') sessionId: string) {
    return unwrapOrThrow(await this.svc.listForSession(safeInt(sessionId, 0)));
  }

  @ApiOperation({ summary: 'Add a named crew member (operator/assistant) with optional contribution %' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 409, description: 'Member already in this session crew' })
  @Post()
  @UsePipes(new ZodValidationPipe(AddCrewMemberSchema))
  async add(@Body() body: AddCrewMemberDto) {
    return unwrapOrThrow(await this.svc.addMember({
      sessionId: body.sessionId,
      employeeId: body.employeeId,
      roleLabel: body.roleLabel ?? null,
      sharePercent: body.sharePercent ?? null,
    }));
  }

  @ApiOperation({ summary: 'Remove a crew member' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.removeMember(safeInt(id, 0)));
  }
}
