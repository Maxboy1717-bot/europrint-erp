/**
 * @module pp-bom.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { GetBomsQuery } from '../application/queries/get-boms.query';
import { ApproveBomCommand } from '../application/commands/approve-bom.handler';
import { BomService } from '../bom/bom.service';
import { z } from 'zod';

enum Role {
  TECHNOLOGIST = 'technologist',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

const CreateBomDtoSchema = z.object({
  productId: z.number(),
  items: z.array(z.any()),
  reason: z.string().min(5),
});

const ApproveBomDtoSchema = z.object({
  approvedBy: z.number(),
  reason: z.string().min(5),
});

@ApiThrottle()
@ApiTags('Pp Bom')
@Controller('pp/bom')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpBomController {
  private readonly logger = new Logger(PpBomController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly bomService: BomService,
  ) {}

  @ApiOperation({ summary: 'List boms' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listBoms(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.queryBus.execute(new GetBomsQuery({ page: Number(page), limit: Number(limit) }));
    return unwrapOrThrow(result);
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getById(@Param('id') id: number){
    this.logger.log(`Getting BOM #${id}`);
    return this.bomService.findOne(Number(id));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: z.infer<typeof CreateBomDtoSchema>){
    const parsed = CreateBomDtoSchema.parse(dto);
    const res = await this.bomService.create(parsed);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Update bom' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  async updateBom(@Param('id') id: number, @Body() dto: Record<string, unknown>) {
    this.logger.log(`Updating BOM #${id}`);
    const res = await this.bomService.update(Number(id), dto);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Approve bom' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveBom(@Param('id') id: number, @Body() dto: z.infer<typeof ApproveBomDtoSchema>){
    const parsed = ApproveBomDtoSchema.parse(dto);
    const command = new ApproveBomCommand(id, parsed.approvedBy);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Delete bom' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN)
  async deleteBom(@Param('id') id: number) {
    this.logger.log(`Deleting BOM #${id}`);
    const res = await this.bomService.remove(Number(id));
    return unwrapOrThrow(res);
  }
}
