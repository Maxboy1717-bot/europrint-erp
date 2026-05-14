/**
 * @module ideal-rasm.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { IdealRasmService } from './ideal-rasm.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('ideal-rasm')
export class IdealRasmController {
  constructor(private readonly svc: IdealRasmService) {}

  @Post()
  async create() {
    throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get()
  async getAll() {
    return unwrapOrInternal(await this.svc.getAll());
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles('director', 'super_admin', 'admin')
  async updateAll(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateAll(body));
  }

  @Put(':key')
  @UseGuards(RolesGuard)
  @Roles('director', 'super_admin', 'admin')
  async updateOne(@Param('key') key: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateOne(key, body));
  }
}
