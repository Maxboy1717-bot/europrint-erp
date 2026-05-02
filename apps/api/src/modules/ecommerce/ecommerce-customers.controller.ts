import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Put, Body, Param, Query, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { EcommerceService } from './ecommerce.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { EcommerceBodySchema, EcommerceBodyDto } from './dto/ecommerce.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Ecommerce - Customers')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller()
export class EcommerceCustomersController {
  private readonly logger = new Logger(EcommerceCustomersController.name);

  constructor(private readonly svc: EcommerceService) {}

  @Get('admin/customers')
  @Roles('admin', 'hr')
  async getCustomers(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.listCustomers(query));
  }

  @Get('admin/customers/:id')
  @Roles('admin', 'hr')
  async getCustomer(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getCustomer(id));
  }

  @Put('admin/customers/:id')
  @Roles('admin', 'hr')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async updateCustomer(@Param('id') id: string, @Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.updateCustomer(id, body));
  }

  @Get('admin/ecommerce/stats')
  @Roles('admin', 'hr')
  async getEcommerceStats() {
    return unwrapOrInternal(await this.svc.getStats());
  }
}
