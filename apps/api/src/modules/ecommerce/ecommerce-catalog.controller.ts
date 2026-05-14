/**
 * @module ecommerce-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { EcommerceService } from './ecommerce.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { EcommerceBodySchema, EcommerceBodyDto } from './dto/ecommerce.dto';
import { unwrapOrInternal } from '@common/http-result';

type CategoryRow = { id: number; name: string; [key: string]: unknown };

@ApiTags('Ecommerce - Catalog')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller()
export class EcommerceCatalogController {
  private readonly logger = new Logger(EcommerceCatalogController.name);

  constructor(private readonly svc: EcommerceService) {}

  @Get('admin/products')
  @Roles('admin', 'hr')
  async getProducts(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.listProducts(query));
  }

  @Get('admin/products/:id')
  @Roles('admin', 'hr')
  async getProduct(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getProduct(id));
  }

  @Post('admin/products')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async createProduct(@Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.createProduct(body));
  }

  @Put('admin/products/:id')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async updateProduct(@Param('id') id: string, @Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.updateProduct(id, body));
  }

  @Delete('admin/products/:id')
  @Roles('admin', 'hr')
  deleteProduct() {
    throw new HttpException(
      { error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" },
      HttpStatus.FORBIDDEN,
    );
  }

  @Get('admin/categories')
  @Roles('admin', 'hr')
  async getCategories() {
    return unwrapOrInternal(await this.svc.listCategories());
  }

  @Get('admin/categories/:id')
  @Roles('admin', 'hr')
  async getCategory(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getCategoryById(id));
  }

  @Post('admin/categories')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async createCategory(@Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.createCategory(body));
  }

  @Put('admin/categories/:id')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async updateCategory(@Param('id') id: string, @Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.updateCategory(id, body));
  }

  @Delete('admin/categories/:id')
  @Roles('admin', 'hr')
  async deleteCategory(@Param('id') id: string) {
    await this.svc.checkCategoryEmpty(id);
    throw new HttpException(
      { error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" },
      HttpStatus.FORBIDDEN,
    );
  }
}
