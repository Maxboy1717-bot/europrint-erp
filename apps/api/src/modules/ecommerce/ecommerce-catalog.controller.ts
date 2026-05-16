/**
 * @module ecommerce-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '../../common/decorators/roles.decorator';
import { EcommerceService } from './ecommerce.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { EcommerceBodySchema, EcommerceBodyDto } from './dto/ecommerce.dto';
import { unwrapOrInternal } from '@common/http-result';

type CategoryRow = { id: number; name: string; [key: string]: unknown };

@ApiTags('Ecommerce - Catalog')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class EcommerceCatalogController {
  private readonly logger = new Logger(EcommerceCatalogController.name);

  constructor(private readonly svc: EcommerceService) {}

  @ApiOperation({ summary: 'Get products' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('admin/products')
  @Roles('admin', 'hr')
  async getProducts(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.listProducts(query));
  }

  @ApiOperation({ summary: 'Get product' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('admin/products/:id')
  @Roles('admin', 'hr')
  async getProduct(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getProduct(id));
  }

  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('admin/products')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async createProduct(@Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.createProduct(body));
  }

  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('admin/products/:id')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async updateProduct(@Param('id') id: string, @Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.updateProduct(id, body));
  }

  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('admin/products/:id')
  @Roles('admin', 'hr')
  deleteProduct() {
    throw new HttpException(
      { error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" },
      HttpStatus.FORBIDDEN,
    );
  }

  @ApiOperation({ summary: 'Get categories' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('admin/categories')
  @Roles('admin', 'hr')
  async getCategories() {
    return unwrapOrInternal(await this.svc.listCategories());
  }

  @ApiOperation({ summary: 'Get category' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('admin/categories/:id')
  @Roles('admin', 'hr')
  async getCategory(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getCategoryById(id));
  }

  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('admin/categories')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async createCategory(@Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.createCategory(body));
  }

  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('admin/categories/:id')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async updateCategory(@Param('id') id: string, @Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.updateCategory(id, body));
  }

  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
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
