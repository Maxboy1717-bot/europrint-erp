import { assertFound } from '@common/assertions';
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  UsePipes,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ErpService } from './erp.service';
import { safeInt } from '../hr/common/db-rows';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ErpBodySchema, ErpBodyDto } from './dto/erp.dto';

const ERP_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'planner'];
const ERP_WRITE = ['super_admin', 'director', 'production_manager', 'technologist'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('erp')
@UseGuards(RolesGuard)
@Roles(...ERP_ROLES)
export class ErpProductsController {
  private readonly logger = new Logger(ErpProductsController.name);

  constructor(private readonly svc: ErpService) {}

  @Get('products')
  async listProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listProducts(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    const r = await this.svc.getProduct(safeInt(id, 0));
    assertFound(r, 'Product not found');
    return r;
  }

  @Put('products/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateProduct(@Param('id') id: string, @Body() body: ErpBodyDto) {
    const r = await this.svc.updateProduct(safeInt(id, 0), body);
    assertFound(r, 'Product not found');
    return r;
  }

  @Get('bom-headers')
  async listBomHeaders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listBomHeaders(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Get('bom-headers/:id')
  async getBomHeader(@Param('id') id: string) {
    const r = await this.svc.getBomHeader(safeInt(id, 0));
    assertFound(r, 'BOM header not found');
    return r;
  }

  @Get('bom-headers/:bomId/explosion')
  async bomExplosion(
    @Param('bomId') bomId: string,
    @Query('quantity') quantity?: string,
  ) {
    return unwrapOrThrow(await this.svc.bomExplosion(safeInt(bomId, 0), safeInt(quantity, 1)));
  }

  @Get('bom-items')
  async listBomItems(@Query('bomHeaderId') bomHeaderId?: string) {
    return unwrapOrThrow(await this.svc.listBomItems(safeInt(bomHeaderId ?? '0', 0)));
  }

  @Post('bom-items')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createBomItem(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createBomItem(body));
  }

  @Put('bom-items/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateBomItem(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateBomItem(safeInt(id, 0), body));
  }

  @Get('routings')
  async listRoutings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listRoutings(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Get('routings/:id')
  async getRouting(@Param('id') id: string) {
    const r = await this.svc.getRouting(safeInt(id, 0));
    assertFound(r, 'Routing not found');
    return r;
  }

  @Get('routing-operations')
  async listRoutingOps(@Query('routingId') routingId?: string) {
    return unwrapOrThrow(await this.svc.listRoutingOperations(routingId ? safeInt(routingId, 0) : undefined));
  }

  @Put('routing-operations/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateRoutingOp(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateRoutingOperation(safeInt(id, 0), body));
  }
}
