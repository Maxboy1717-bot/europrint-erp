import {
Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { InventoryMaterialsService } from '../application/inventory-materials.service';
import { safeInt } from '../../hr/common/db-rows';
import { WmsUpdateMaterialSchema, WmsUpdateMaterialDto } from '../dto/wms.dto';

const INV_READ = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'director', 'ERP_MANAGER'];
const INV_WRITE = ['super_admin', 'warehouse_manager', 'director', 'ERP_MANAGER'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryMaterialsController {
  private readonly logger = new Logger(InventoryMaterialsController.name);

  constructor(private readonly svc: InventoryMaterialsService) {}

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
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('materials/:id/360-card')
  @Roles(...INV_READ)
  async get360Card(@Param('id') id: string) {
    this.logger.log(`GET 360-card for material ${id}`);
    return unwrapOrThrow(await this.svc.getMaterial360Card(safeInt(id, 0)));
  }

  @Put('materials/:id')
  @UsePipes(new ZodValidationPipe(WmsUpdateMaterialSchema))
  @Roles(...INV_WRITE)
  async updateMaterial(@Param('id') id: string, @Body() body: WmsUpdateMaterialDto) {
    this.logger.log(`PUT material ${id}`);
    return unwrapOrThrow(await this.svc.updateMaterial(safeInt(id, 0), body));
  }

  @Delete('materials/:id')
  @UseInterceptors(AuditInterceptor)
  @Roles(...INV_WRITE)
  async deleteMaterial(@Param('id') id: string) {
    this.logger.log(`Deleting material ${id}`);
    return unwrapOrThrow(await this.svc.deleteMaterial(safeInt(id, 0)));
  }

  @Get('materials/low-stock')
  @Roles(...INV_READ)
  async getLowStock() {
    this.logger.log('GET low stock materials');
    return unwrapOrThrow(await this.svc.getLowStockList());
  }
}
