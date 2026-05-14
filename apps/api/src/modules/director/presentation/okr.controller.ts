/**
 * @module okr.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertFound, assertRequired } from '@common/assertions';
import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { OkrService } from '../application/okr.service';
import {
  OkrCreateObjectiveSchema, OkrCreateObjectiveDto,
  OkrUpdateObjectiveSchema, OkrUpdateObjectiveDto,
  OkrCreateKeyResultSchema, OkrCreateKeyResultDto,
  OkrUpdateKeyResultSchema, OkrUpdateKeyResultDto,
} from './dto/director.dto';

const MANAGER_ROLES = ['manager', 'director', 'super_admin'];
const DIRECTOR_ROLES = ['director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('okr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...MANAGER_ROLES)
export class OkrController {
  private readonly logger = new Logger(OkrController.name);

  constructor(private readonly svc: OkrService) {}

  @Get('objectives')
  async listObjectives(
    @Query('type') type?: string,
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.svc.listObjectives(type ?? null, year ? parseInt(year, 10) : null, quarter ?? null, status ?? null));
  }

  @Get('objectives/:id')
  async getObjective(@Param('id') id: string) {
    const _rData = await this.svc.getObjective(parseInt(id, 10));
    assertOk(_rData);
    const data = _rData.data;
    assertFound(data, 'Topilmadi');
    return data[0];
  }

  @Post('objectives')
  @UsePipes(new ZodValidationPipe(OkrCreateObjectiveSchema))
  async createObjective(
    @Body() body: OkrCreateObjectiveDto,
    @CurrentUser() user: { id: number },
  ) {
    const { title, type, year, quarter, description } = body;
    assertRequired(title, 'title majburiy');
    return unwrapOrInternal(await this.svc.createObjective(
      title, type ?? 'company',
      year ? Number(year) : _time.now().getFullYear(),
      quarter ?? 'Q1', description ?? null, user.id,
    ));
  }

  @Patch('objectives/:id')
  @UsePipes(new ZodValidationPipe(OkrUpdateObjectiveSchema))
  async updateObjective(@Param('id') id: string, @Body() body: OkrUpdateObjectiveDto) {
    const { title, status, description } = body;
    return unwrapOrInternal(await this.svc.updateObjective(parseInt(id, 10), title ?? null, status ?? null, description ?? null));
  }

  @Delete('objectives/:id')
  @Roles(...DIRECTOR_ROLES)
  async deleteObjective(@Param('id') id: string) {
    await this.svc.deleteObjective(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @Get('key-results')
  async listKeyResults(@Query('objective_id') objectiveId?: string) {
    return unwrapOrInternal(await this.svc.listKeyResults(objectiveId ? parseInt(objectiveId, 10) : null));
  }

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

  @Delete('key-results/:id')
  @Roles(...DIRECTOR_ROLES)
  async deleteKeyResult(@Param('id') id: string) {
    await this.svc.deleteKeyResult(parseInt(id, 10));
    return { message: "O'chirildi" };
  }

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }
}
