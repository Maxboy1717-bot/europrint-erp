/**
 * @module finance-cfo-config.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CfoConfigService } from '../domain/services/cfo-config.service';
import { unwrapOrInternal } from '@common/http-result';

const UpdateCfoConfigDto = z.object({
  value: z.number({ required_error: 'value maydoni talab qilinadi', invalid_type_error: 'value raqam bo\'lishi kerak' }).finite(),
});

const CreateCfoConfigDto = z.object({
  key:   z.string().min(1, 'key maydoni talab qilinadi').max(100),
  value: z.number({ required_error: 'value maydoni talab qilinadi', invalid_type_error: 'value raqam bo\'lishi kerak' }).finite(),
});

@ApiThrottle()
@ApiTags('Finance Cfo Config')
@ApiBearerAuth()
@Controller('finance/cfo-config')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceCfoConfigController {
  constructor(private readonly cfoConfig: CfoConfigService) {}

  /** POST /api/finance/cfo-config — create-or-update a config entry by key (upsert). */
  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @RequirePermission('finance.cfo-config:FULL')
  async create(@Body() body: unknown) {
    // A6: was a {success:true} green-lie that saved nothing. POST now upserts a CFO config
    // entry by key via the SAME canonical path as PUT /:key (cfoConfig.update ->
    // repo.upsertCfoConfig). cfo_config(config_key, config_value) table exists.
    const dto = CreateCfoConfigDto.parse(body);
    return unwrapOrInternal(await this.cfoConfig.update(dto.key, dto.value));
  }

  /** GET /api/finance/cfo-config — returns all CFO config entries */
  @ApiOperation({ summary: 'Find all' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @RequirePermission('finance.cfo-config:READ')
  async findAll() {
    return unwrapOrInternal(await this.cfoConfig.findAll());
  }

  /** PUT /api/finance/cfo-config/:key — update a single config value */
  @ApiOperation({ summary: 'Update' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put(':key')
  @RequirePermission('finance.cfo-config:FULL')
  async update(
    @Param('key') key: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateCfoConfigDto.parse(body);
    return unwrapOrInternal(await this.cfoConfig.update(key, dto.value));
  }
}
