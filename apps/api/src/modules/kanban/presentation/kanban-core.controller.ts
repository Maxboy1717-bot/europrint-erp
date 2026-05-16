/**
 * @module kanban-core.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Put, Delete,
  Param, Body,
  UseGuards, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '@common/guards/roles.guard';
import { Roles }       from '@common/decorators/roles.decorator';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { KanbanExtService } from '../application/kanban-ext.service';
import {
  UpdateFlowDtoSchema, UpdateFlowDto,
  UpdateRobotDtoSchema, UpdateRobotDto,
  UpdateBoardDtoSchema, UpdateBoardDto,
} from './dto/kanban-ext.dto';
import { z } from 'zod';

const CreateFlowSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  assignmentType: z.string().max(50).optional(),
  userIds: z.array(z.union([z.string(), z.number()])).optional(),
}).passthrough();

@ApiTags('§16 Kanban Extended')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kanban')
@Roles('super_admin', 'director', 'manager', 'employee')
export class KanbanCoreController {

  constructor(private readonly svc: KanbanExtService) {}

  // ─── Flows ────────────────────────────────────────────────────────────────

  @Get('boards/:boardId/flows')
  @ApiOperation({ summary: 'Board flowlari ro\'yxati' })
  async getFlows(@Param('boardId') boardId: string) {
    return unwrapOrBadRequest(await this.svc.getFlowsByBoard(boardId));
  }

  @Post('flows')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi flow yaratish' })
  async createFlow(@Body() body: unknown) {
    const dto = CreateFlowSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createFlow({
      boardId: String(dto.boardId ?? ''),
      name: String(dto.name ?? 'Yangi oqim'),
      description: dto.description ? String(dto.description) : undefined,
      assignmentType: dto.assignmentType ? String(dto.assignmentType) : 'round_robin',
      userIds: Array.isArray(dto.userIds) ? dto.userIds.map(String) : [],
    }));
  }

  @Get('flows/:id')
  @ApiOperation({ summary: 'Flow tafsiloti' })
  async getFlow(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getFlowById(id));
  }

  @Put('flows/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Flowni yangilash' })
  async updateFlow(@Param('id') id: string, @Body() body: UpdateFlowDto) {
    const dto = UpdateFlowDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateFlow(id, dto));
  }

  @Delete('flows/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Flowni o\'chirish' })
  async deleteFlow(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteFlow(id));
  }

  // ─── Robots ───────────────────────────────────────────────────────────────

  @Get('robots/:id')
  @ApiOperation({ summary: 'Robot tafsiloti' })
  async getRobot(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getRobotById(id));
  }

  @Put('robots/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Robotni yangilash' })
  async updateRobot(@Param('id') id: string, @Body() body: UpdateRobotDto) {
    const dto = UpdateRobotDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateRobot(id, dto));
  }

  @Delete('robots/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Robotni o\'chirish' })
  async deleteRobot(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteRobot(id));
  }

  // ─── Board ────────────────────────────────────────────────────────────────

  @Put('boards/:boardId')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Boardni yangilash' })
  async updateBoard(@Param('boardId') boardId: string, @Body() body: UpdateBoardDto) {
    const dto = UpdateBoardDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateBoard(boardId, dto));
  }

  @Delete('boards/:boardId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Boardni o\'chirish' })
  async deleteBoard(@Param('boardId') boardId: string) {
    return unwrapOrBadRequest(await this.svc.deleteBoard(boardId));
  }
}
