/**
 * @module wms-goods-issue.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Delete, Patch, Body, Param, Query, ParseIntPipe,
  UseGuards, UseInterceptors, Logger, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { unwrapOrNotFound, unwrapOrThrow } from '@common/http-result';
import { CommandBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { Result } from '@common/result';
import { GoodsIssueCommand } from '../application/commands/goods-issue.handler';
import { WmsCrudService } from '../application/wms-crud.service';
import { PatchGoodsIssueDto } from './dto/wms-crud.dto';

enum Role {
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

const IssueGoodsSchema = z.object({
  materialId: z.number().int().positive(),
  warehouseId: z.number().int().positive(),
  amount: z.number().positive(),
  ppId: z.number().int().positive().nullable().optional(),
});

const ListGoodsIssueSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

@ApiThrottle()
@ApiTags('Wms Goods Issue')
@Controller('wms/goods-issue')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class WmsGoodsIssueController {
  private readonly logger = new Logger(WmsGoodsIssueController.name);

  constructor(
    private commandBus: CommandBus,
    private readonly crudSvc: WmsCrudService,
  ) {}

  @ApiOperation({ summary: 'List goods issues' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listGoodsIssues(@Query() query: unknown) {
    const { limit, offset } = ListGoodsIssueSchema.parse(query);
    const r = await this.crudSvc.listGoodsIssues(limit, offset);
    return { data: unwrapOrThrow(r) };
  }

  @ApiOperation({ summary: 'Get goods issue by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getGoodsIssue(@Param('id', ParseIntPipe) id: number) {
    const r = await this.crudSvc.getGoodsIssueById(id);
    return { data: unwrapOrNotFound(r) };
  }

  @ApiOperation({ summary: 'Issue goods' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async issueGoods(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Result<void>> {
    const dto = IssueGoodsSchema.parse(body);
    const command = new GoodsIssueCommand(
      dto.materialId,
      dto.warehouseId,
      dto.amount,
      dto.ppId ?? 0,
      user?.id ?? null,
    );
    const result: unknown = await this.commandBus.execute(command);
    return (Array.isArray(result) ? result[0] : result) as Result<void>;
  }

  @ApiOperation({ summary: 'Patch goods issue' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async patchGoodsIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatchGoodsIssueDto,
  ) {
    const r = await this.crudSvc.patchGoodsIssue(id, dto as Record<string, unknown>);
    return { data: unwrapOrNotFound(r) };
  }

  @ApiOperation({ summary: 'Delete goods issue' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete(':id')
  @Roles(Role.WAREHOUSE_KEEPER, Role.SUPER_ADMIN, Role.DIRECTOR)
  async deleteGoodsIssue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.crudSvc.softDeleteGoodsIssue(id, user?.id ?? null);
    return unwrapOrNotFound(r);
  }
}
