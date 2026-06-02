/**
 * @module pp-routing.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Body, Param, Query, UseGuards, UseInterceptors, Logger, NotImplementedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@ApiTags('Pp Routing')
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

  @ApiOperation({ summary: 'List routings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listRoutings(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.queryBus.execute(new GetRoutingsQuery({ page: Number(page), limit: Number(limit) }));
    return unwrapOrThrow(result);
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async getById(@Param('id') id: number){
    this.logger.log(`Getting routing #${id}`);
    const result = await this.routingsService.findOne(Number(id));
    return result;
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: z.infer<typeof CreateRoutingDtoSchema>){
    CreateRoutingDtoSchema.parse(dto);
    // 501: routing creation depends on the production world, which is empty/deferred. Composite
    // create (routings header + operations[]); routing_operations.work_center_id FK-references
    // work_centers (RESTRICT) and the live production world is empty (work_centers=0, routings=0,
    // routing_operations=0). The existing RoutingsService/repo create is also incomplete — it only
    // inserts the header into `routings` and never writes operations[]. productId depends on a
    // product catalog (Phase 4 production deferred). Wiring would create an orphan/broken routing
    // or FK-fail. Tracked for Stage 0.0 (two-order-worlds) + production-world setup.
    throw new NotImplementedException('Routing creation requires production-world setup (work centers + product catalog) - not yet configured. Tracked for Stage 0.0.');
  }

  @ApiOperation({ summary: 'Update routing' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  async updateRouting(@Param('id') id: number, @Body() dto: Record<string, unknown>) {
    this.logger.log(`Updating routing #${id}`);
    const res = await this.routingsService.update(Number(id), dto);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Approve routing' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Delete routing' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN)
  async deleteRouting(@Param('id') id: number) {
    this.logger.log(`Deleting routing #${id}`);
    const res = await this.routingsService.remove(Number(id));
    return unwrapOrThrow(res);
  }
}
