/**
 * @module ecommerce-customers.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Put, Body, Param, Query, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '../../common/decorators/roles.decorator';
import { EcommerceService } from './ecommerce.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { EcommerceBodySchema, EcommerceBodyDto } from './dto/ecommerce.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Ecommerce - Customers')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class EcommerceCustomersController {
  private readonly logger = new Logger(EcommerceCustomersController.name);

  constructor(private readonly svc: EcommerceService) {}

  @ApiOperation({ summary: 'Get customers' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('admin/customers')
  @Roles('admin', 'hr')
  async getCustomers(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.listCustomers(query));
  }

  @ApiOperation({ summary: 'Get customer' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('admin/customers/:id')
  @Roles('admin', 'hr')
  async getCustomer(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getCustomer(id));
  }

  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('admin/customers/:id')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async updateCustomer(@Param('id') id: string, @Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.updateCustomer(id, body));
  }

  @ApiOperation({ summary: 'Get ecommerce stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('admin/ecommerce/stats')
  @Roles('admin', 'hr')
  async getEcommerceStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }
}
