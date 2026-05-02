import { Body, Controller, Get, HttpCode, Post, Query, UseGuards , UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ProductionFactsService } from './production-facts.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('production-facts')
export class ProductionFactsController {
  constructor(private readonly svc: ProductionFactsService) {}

  @Get()
  async getAll(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getAll(q));
  }

  @Get('variance')
  async getVariance(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getVariance(q));
  }

  @Get('operators')
  async getOperators() {
    return unwrapOrInternal(await this.svc.getOperators());
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'production_manager', 'pp_manager', 'operator')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.create(body));
  }
}
