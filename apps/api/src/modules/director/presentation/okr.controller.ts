/**
 * @module okr.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertFound, assertRequired } from '@common/assertions';
import { z } from 'zod';
import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { OkrService } from '../application/okr.service';
import {
  OkrCreateObjectiveSchema,
  OkrUpdateObjectiveSchema, OkrUpdateObjectiveDto,
  OkrCreateKeyResultSchema, OkrCreateKeyResultDto,
  OkrUpdateKeyResultSchema, OkrUpdateKeyResultDto,
} from './dto/director.dto';

const MANAGER_ROLES = ['manager', 'director', 'super_admin'];
const DIRECTOR_ROLES = ['director', 'super_admin'];

// P30 EP-DIR-015/016: OkrCreateObjectiveSchema (director.dto.ts — not owned)
// extended with cascade fields. Parsed inline so unknown keys are not stripped
// by the shared ZodValidationPipe before reaching the handler.
const OkrCreateObjectiveP30Schema = OkrCreateObjectiveSchema.extend({
  parent_goal_id: z.coerce.number().int().positive().nullish(),
  owner_card_id:  z.coerce.number().int().positive().nullish(),
});

@ApiThrottle()
@ApiTags('Okr')
@Controller('okr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class OkrController {
  private readonly logger = new Logger(OkrController.name);

  constructor(private readonly svc: OkrService) {}

  @ApiOperation({ summary: 'List objectives' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('objectives')
  async listObjectives(
    @Query('type') type?: string,
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
    @Query('status') status?: string,
    @Query('parent_goal_id') parentGoalId?: string,
  ) {
    return unwrapOrInternal(await this.svc.listObjectives(
      type ?? null,
      year ? parseInt(year, 10) : null,
      quarter ?? null,
      status ?? null,
      parentGoalId ? parseInt(parentGoalId, 10) : null,
    ));
  }

  @ApiOperation({ summary: 'Get objective' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('objectives/:id')
  async getObjective(@Param('id') id: string) {
    const _rData = await this.svc.getObjective(parseInt(id, 10));
    assertOk(_rData);
    const data = _rData.data;
    assertFound(data, 'Topilmadi');
    return data[0];
  }

  @ApiOperation({ summary: 'Create objective' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('objectives')
  async createObjective(
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const dto = OkrCreateObjectiveP30Schema.parse(body);
    const { title, type, year, quarter, description, parent_goal_id, owner_card_id } = dto;
    assertRequired(title, 'title majburiy');
    return unwrapOrInternal(await this.svc.createObjective(
      title, type ?? 'company',
      year ? Number(year) : _time.now().getFullYear(),
      quarter ?? 'Q1', description ?? null, user.id,
      parent_goal_id ?? null, owner_card_id ?? null,
    ));
  }

  @ApiOperation({ summary: 'Update objective' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('objectives/:id')
  @UsePipes(new ZodValidationPipe(OkrUpdateObjectiveSchema))
  async updateObjective(@Param('id') id: string, @Body() body: OkrUpdateObjectiveDto) {
    const { title, status, description } = body;
    return unwrapOrInternal(await this.svc.updateObjective(parseInt(id, 10), title ?? null, status ?? null, description ?? null));
  }

  @ApiOperation({ summary: 'Delete objective' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('objectives/:id')
  @Roles(...DIRECTOR_ROLES)
  async deleteObjective(@Param('id') id: string) {
    await this.svc.deleteObjective(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @ApiOperation({ summary: 'List key results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('key-results')
  async listKeyResults(@Query('objective_id') objectiveId?: string) {
    return unwrapOrInternal(await this.svc.listKeyResults(objectiveId ? parseInt(objectiveId, 10) : null));
  }

  @ApiOperation({ summary: 'Create key result' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('key-results')
  @UsePipes(new ZodValidationPipe(OkrCreateKeyResultSchema))
  async createKeyResult(
    @Body() body: OkrCreateKeyResultDto,
    @CurrentUser() user: { id: number },
  ) {
    const { objective_id, title, target_value, unit, current_value } = body;
    assertRequired(objective_id, 'objective_id va title majburiy');
    assertRequired(title, 'objective_id va title majburiy');
    return unwrapOrInternal(await this.svc.createKeyResult(
      Number(objective_id), title as string,
      target_value ? Number(target_value) : 100,
      current_value != null ? Number(current_value) : 0,
      (unit as string) ?? 'unit', user.id,
    ));
  }

  @ApiOperation({ summary: 'Update key result' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('key-results/:id')
  @UsePipes(new ZodValidationPipe(OkrUpdateKeyResultSchema))
  async updateKeyResult(@Param('id') id: string, @Body() body: OkrUpdateKeyResultDto) {
    const { current_value, status, title } = body;
    return unwrapOrInternal(await this.svc.updateKeyResult(
      parseInt(id, 10),
      current_value != null ? Number(current_value) : null,
      (status as string) ?? null,
      (title as string) ?? null,
    ));
  }

  @ApiOperation({ summary: 'Delete key result' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('key-results/:id')
  @Roles(...DIRECTOR_ROLES)
  async deleteKeyResult(@Param('id') id: string) {
    await this.svc.deleteKeyResult(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }
}
