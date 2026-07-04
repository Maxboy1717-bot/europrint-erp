/**
 * @module ideal-rasm.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpException, HttpStatus, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { IdealRasmService } from './ideal-rasm.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@Roles('admin', 'manager', 'hr_manager', 'director', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller('ideal-rasm')
export class IdealRasmController {
  constructor(private readonly svc: IdealRasmService) {}

  // A9/green-lie retire (2026-06-05): `POST /api/ideal-rasm` create() returned {success:true}
  // and saved nothing. The FE (IdealRasmPage) saves targets via PUT /api/ideal-rasm (updateAll);
  // this POST had no caller. Removed the lie. See docs/yashil-yolgon-reja-2026-06-05.md A9.

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
