/**
 * @module erp-products.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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

  @Post('products')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createProduct(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createProduct(body));
  }

  @Put('products/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateProduct(@Param('id') id: string, @Body() body: ErpBodyDto) {
    const r = await this.svc.updateProduct(safeInt(id, 0), body);
    assertFound(r, 'Product not found');
    return r;
  }

  @Patch('products/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async patchProduct(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateProduct(safeInt(id, 0), body));
  }

  @Delete('products/:id')
  @Roles(...ERP_WRITE)
  async deleteProduct(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteProduct(safeInt(id, 0)));
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

  @Post('bom-headers')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createBomHeader(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createBomHeader(body));
  }

  @Delete('bom-headers/:id')
  @Roles(...ERP_WRITE)
  async deleteBomHeader(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteBomHeader(safeInt(id, 0)));
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

  @Delete('bom-items/:id')
  @Roles(...ERP_WRITE)
  async deleteBomItem(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteBomItem(safeInt(id, 0)));
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

  @Post('routings')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createRouting(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createRouting(body));
  }

  @Delete('routings/:id')
  @Roles(...ERP_WRITE)
  async deleteRouting(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteRouting(safeInt(id, 0)));
  }

  @Post('routing-operations')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createRoutingOp(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createRoutingOperation(body));
  }

  @Put('routing-operations/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateRoutingOp(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateRoutingOperation(safeInt(id, 0), body));
  }

  @Delete('routing-operations/:id')
  @Roles(...ERP_WRITE)
  async deleteRoutingOp(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteRoutingOperation(safeInt(id, 0)));
  }
}
