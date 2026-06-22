/**
 * @module inventory-materials.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { throwFromError, unwrapOrThrow } from '@common/http-result';

const CreateMaterialSchema = z.object({
  name: z.string().max(500).optional(),
  code: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  unit: z.string().max(50).optional(),
  unitPrice: z.union([z.string(), z.number()]).optional(),
}).passthrough();
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { InventoryMaterialsService } from '../application/inventory-materials.service';
import { safeInt } from '../../hr/common/db-rows';
import { WmsUpdateMaterialSchema, WmsUpdateMaterialDto } from '../dto/wms.dto';

const INV_READ = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'director', 'ERP_MANAGER'];
const INV_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Inventory Materials')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryMaterialsController {
  private readonly logger = new Logger(InventoryMaterialsController.name);

  constructor(private readonly svc: InventoryMaterialsService) {}

  @ApiOperation({ summary: 'List materials' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('materials')
  @Roles(...INV_READ)
  async listMaterials(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log('GET inventory materials');
    const r = await this.svc.listMaterials(search, category, safeInt(page, 1), safeInt(limit, 50));
    // Service returns { items, total, page, limit } (items already an array, total a real count).
    return r.ok ? r.data : { items: [], total: 0, page: safeInt(page, 1), limit: safeInt(limit, 50) };
  }

  @ApiOperation({ summary: 'Get360 card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('materials/:id/360-card')
  @Roles(...INV_READ)
  async get360Card(@Param('id') id: string) {
    this.logger.log(`GET 360-card for material ${id}`);
    return unwrapOrThrow(await this.svc.getMaterial360Card(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Update material' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('materials/:id')
  @UsePipes(new ZodValidationPipe(WmsUpdateMaterialSchema))
  @Roles(...INV_WRITE)
  async updateMaterial(@Param('id') id: string, @Body() body: WmsUpdateMaterialDto) {
    this.logger.log(`PUT material ${id}`);
    return unwrapOrThrow(await this.svc.updateMaterial(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Delete material' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('materials/:id')
  @UseInterceptors(AuditInterceptor)
  @Roles(...INV_WRITE)
  async deleteMaterial(@Param('id') id: string) {
    this.logger.log(`Deleting material ${id}`);
    return unwrapOrThrow(await this.svc.deleteMaterial(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Create material' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('materials')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...INV_WRITE)
  async createMaterial(@Body() body: unknown) {
    // Stage 4.1 material unification: WRITER now inserts into canonical material_cards.
    const dto = CreateMaterialSchema.parse(body);
    this.logger.log('POST inventory material (material_cards)');
    return unwrapOrThrow(await this.svc.createMaterial(dto));
  }

  @ApiOperation({ summary: 'Get low stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('materials/low-stock')
  @Roles(...INV_READ)
  async getLowStock() {
    this.logger.log('GET low stock materials');
    return unwrapOrThrow(await this.svc.getLowStockList());
  }
}
