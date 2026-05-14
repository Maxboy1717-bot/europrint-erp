/**
 * @module pp-routing.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { ApproveRoutingCommand } from '../application/commands/approve-routing.handler';
import { GetRoutingsQuery } from '../application/queries/get-routings.query';
import { RoutingsService } from '../routings/routings.service';
import { z } from 'zod';

enum Role {
  TECHNOLOGIST = 'technologist',
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
}

const CreateRoutingDtoSchema = z.object({
  productId: z.number(),
  operations: z.array(z.any()),
  reason: z.string().min(5),
});

const ApproveRoutingDtoSchema = z.object({
  approvedBy: z.number(),
  reason: z.string().min(5),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('pp/routing')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class PpRoutingController {
  private readonly logger = new Logger(PpRoutingController.name);

  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly routingsService: RoutingsService,
  ) {}

  @Get()
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listRoutings(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.queryBus.execute(new GetRoutingsQuery({ page: Number(page), limit: Number(limit) }));
    return unwrapOrThrow(result);
  }

  @Get(':id')
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getById(@Param('id') id: number){
    this.logger.log(`Getting routing #${id}`);
    const result = await this.routingsService.findOne(Number(id));
    return result;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: z.infer<typeof CreateRoutingDtoSchema>){
    CreateRoutingDtoSchema.parse(dto);
    this.logger.log('Creating routing');
    return 0;
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  async updateRouting(@Param('id') id: number, @Body() dto: Record<string, unknown>) {
    this.logger.log(`Updating routing #${id}`);
    const res = await this.routingsService.update(Number(id), dto);
    return unwrapOrThrow(res);
  }

  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveRouting(
    @Param('id') id: number,
    @Body() dto: z.infer<typeof ApproveRoutingDtoSchema>,
  ){
    const parsed = ApproveRoutingDtoSchema.parse(dto);
    const command = new ApproveRoutingCommand(id, parsed.approvedBy);
    const res = await this.commandBus.execute(command);
    return unwrapOrThrow(res);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN)
  async deleteRouting(@Param('id') id: number) {
    this.logger.log(`Deleting routing #${id}`);
    const res = await this.routingsService.remove(Number(id));
    return unwrapOrThrow(res);
  }
}
