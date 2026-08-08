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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ErpService } from './erp.service';
import { safeInt } from '../hr/common/db-rows';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ErpBodySchema, ErpBodyDto } from './dto/erp.dto';

const ERP_ROLES = ['super_admin', 'director', 'production_manager', 'technologist', 'planner'];
const ERP_WRITE = ['super_admin', 'director', 'production_manager', 'technologist'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Erp Products')
@Controller('erp')
@UseGuards(RolesGuard)
@Roles(...ERP_ROLES)
export class ErpProductsController {
  private readonly logger = new Logger(ErpProductsController.name);

  constructor(private readonly svc: ErpService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'List products' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('products')
  async listProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listProducts(safeInt(page, 1), safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Get product' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    const r = await this.svc.getProduct(safeInt(id, 0));
    assertFound(r, await this.i18n.t('errors.productNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('products')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createProduct(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createProduct(body));
  }

  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('products/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateProduct(@Param('id') id: string, @Body() body: ErpBodyDto) {
    const r = await this.svc.updateProduct(safeInt(id, 0), body);
    assertFound(r, await this.i18n.t('errors.productNotFound'));
    return r;
  }

  @ApiOperation({ summary: 'Patch product' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('products/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async patchProduct(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateProduct(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('products/:id')
  @Roles(...ERP_WRITE)
  async deleteProduct(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteProduct(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'List bom headers' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('bom-headers')
  async listBomHeaders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listBomHeaders(safeInt(page, 1), safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Get bom header' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('bom-headers/:id')
  async getBomHeader(@Param('id') id: string) {
    const r = await this.svc.getBomHeader(safeInt(id, 0));
    assertFound(r, await this.i18n.t('errors.bomNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r;
  }

  @ApiOperation({ summary: 'Bom explosion' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('bom-headers/:bomId/explosion')
  async bomExplosion(
    @Param('bomId') bomId: string,
    @Query('quantity') quantity?: string,
  ) {
    return unwrapOrThrow(await this.svc.bomExplosion(safeInt(bomId, 0), safeInt(quantity, 1)));
  }

  @ApiOperation({ summary: 'List bom items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('bom-items')
  async listBomItems(@Query('bomHeaderId') bomHeaderId?: string) {
    return unwrapOrThrow(await this.svc.listBomItems(safeInt(bomHeaderId ?? '0', 0)));
  }

  @ApiOperation({ summary: 'Create bom header' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('bom-headers')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createBomHeader(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createBomHeader(body));
  }

  @ApiOperation({ summary: 'Delete bom header' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('bom-headers/:id')
  @Roles(...ERP_WRITE)
  async deleteBomHeader(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteBomHeader(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Create bom item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('bom-items')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createBomItem(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createBomItem(body));
  }

  @ApiOperation({ summary: 'Update bom item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('bom-items/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateBomItem(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateBomItem(safeInt(id, 0), body));
  }

  @ApiOperation({ summary: 'Delete bom item' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('bom-items/:id')
  @Roles(...ERP_WRITE)
  async deleteBomItem(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteBomItem(safeInt(id, 0)));
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — read-only, prefer PP routing',
    description:
      "O'qish uchun PP kanonik `routings` jadvalidan foydalanadi (yozish emas — xavfsiz), " +
      'SD buyurtma wizardi (useWizardState.ts) hali ishlatadi. Yangi kod uchun: GET /api/pp/routing.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('routings')
  async listRoutings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.listRoutings(safeInt(page, 1), safeInt(limit, 50)));
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — read-only, prefer PP routing',
    description:
      "O'qish uchun PP kanonik `routings` jadvalidan foydalanadi (yozish emas — xavfsiz). " +
      'Yangi kod uchun: GET /api/pp/routing/:id.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('routings/:id')
  async getRouting(@Param('id') id: string) {
    const r = await this.svc.getRouting(safeInt(id, 0));
    assertFound(r, await this.i18n.t('errors.routingNotFoundWithId', { args: { id: safeInt(id, 0) } }));
    return r;
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — read-only, prefer PP routing',
    description:
      "O'qish uchun PP kanonik `routing_operations` jadvalidan foydalanadi (yozish emas — xavfsiz), " +
      'SD buyurtma wizardi (useWizardState.ts) hali ishlatadi. Yangi kod uchun: GET /api/pp/routing/:id.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('routing-operations')
  async listRoutingOps(@Query('routingId') routingId?: string) {
    return unwrapOrThrow(await this.svc.listRoutingOperations(routingId ? safeInt(routingId, 0) : undefined));
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — blocked, use PP routing instead',
    description:
      "Bu endpoint routings/routing_operations jadvallariga PP tasdiqlash jarayonidan " +
      "bexabar yozgan (ikki-dunyo yozish xavfi) — endi bloklangan (501). " +
      'Real routing CRUD uchun: POST /api/pp/routing.',
  })
  @ApiResponse({ status: 501, description: 'Deprecated — always returns Not Implemented' })
  @Post('routings')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createRouting(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createRouting(body));
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — blocked, use PP routing instead',
    description:
      "Bu endpoint routings jadvalidan PP tasdiqlash jarayonidan bexabar o'chirgan " +
      "(ikki-dunyo yozish xavfi) — endi bloklangan (501). " +
      'Real routing CRUD uchun: DELETE /api/pp/routing/:id.',
  })
  @ApiResponse({ status: 501, description: 'Deprecated — always returns Not Implemented' })
  @Delete('routings/:id')
  @Roles(...ERP_WRITE)
  async deleteRouting(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteRouting(safeInt(id, 0)));
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — blocked, use PP routing instead',
    description:
      "Bu endpoint routing_operations jadvaliga PP tasdiqlash jarayonidan bexabar yozgan " +
      "(ikki-dunyo yozish xavfi) — endi bloklangan (501). " +
      'Real operatsiya CRUD uchun: POST /api/pp/routing/:routingId/operations.',
  })
  @ApiResponse({ status: 501, description: 'Deprecated — always returns Not Implemented' })
  @Post('routing-operations')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async createRoutingOp(@Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.createRoutingOperation(body));
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — blocked, use PP routing instead',
    description:
      "Bu endpoint routing_operations jadvalini PP tasdiqlash jarayonidan bexabar " +
      "yangilagan (ikki-dunyo yozish xavfi) — endi bloklangan (501). " +
      'Real operatsiya CRUD uchun: POST /api/pp/routing.',
  })
  @ApiResponse({ status: 501, description: 'Deprecated — always returns Not Implemented' })
  @Put('routing-operations/:id')
  @Roles(...ERP_WRITE)
  @UsePipes(new ZodValidationPipe(ErpBodySchema))
  async updateRoutingOp(@Param('id') id: string, @Body() body: ErpBodyDto) {
    return unwrapOrThrow(await this.svc.updateRoutingOperation(safeInt(id, 0), body));
  }

  @ApiOperation({
    deprecated: true,
    summary: 'DEPRECATED — blocked, use PP routing instead',
    description:
      "Bu endpoint routing_operations jadvalidan PP tasdiqlash jarayonidan bexabar " +
      "o'chirgan (ikki-dunyo yozish xavfi) — endi bloklangan (501). " +
      'Real operatsiya CRUD uchun: DELETE /api/pp/routing/:routingId/operations/:opId.',
  })
  @ApiResponse({ status: 501, description: 'Deprecated — always returns Not Implemented' })
  @Delete('routing-operations/:id')
  @Roles(...ERP_WRITE)
  async deleteRoutingOp(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.deleteRoutingOperation(safeInt(id, 0)));
  }
}
