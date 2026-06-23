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

const BomItemDtoSchema = z.object({
  // component id may arrive as componentId or materialId from the form
  componentId: z.coerce.number().int().positive().optional(),
  materialId: z.coerce.number().int().positive().optional(),
  componentType: z.enum(['material', 'sub_assembly']).optional(),
  itemNumber: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unit: z.string().optional(),
  scrapPercentage: z.coerce.number().min(0).max(100).optional(),
  position: z.coerce.number().int().optional(),
  notes: z.string().optional(),
}).refine((it) => it.componentId !== undefined || it.materialId !== undefined, {
  message: 'Har bir komponentda componentId yoki materialId bo\'lishi kerak',
});

const CreateBomDtoSchema = z.object({
  productId: z.coerce.number().int().positive(),
  version: z.string().optional(),
  bomNumber: z.string().optional(),
  baseQuantity: z.coerce.number().positive().optional(),
  baseUnit: z.string().optional(),
  description: z.string().optional(),
  items: z.array(BomItemDtoSchema).default([]),
  reason: z.string().min(5).optional(),
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

  @ApiOperation({ summary: 'List BOM items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/items')
  @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN, Role.DIRECTOR)
  async listItems(@Param('id') id: string) {
    return unwrapOrThrow(await this.bomService.findItems(Number(id)));
  }

  @ApiOperation({ summary: 'Add item to BOM' })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SUPER_ADMIN, Role.TECHNOLOGIST)
  async addItem(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return unwrapOrThrow(await this.bomService.addItem(Number(id), dto));
  }

  @ApiOperation({ summary: 'Remove item from BOM' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN)
  async removeItem(@Param('id') _id: string, @Param('itemId') itemId: string) {
    return unwrapOrThrow(await this.bomService.removeItem(Number(itemId)));
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
