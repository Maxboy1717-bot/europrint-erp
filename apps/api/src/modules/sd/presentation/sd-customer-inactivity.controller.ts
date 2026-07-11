/**
 * @module sd-customer-inactivity.controller
 * @description 06-sd #27 — inactive-customer thresholds + manual sweep trigger.
 *   GET rules exposes the seeded A=90/B=60/C=30 thresholds; POST refresh runs the
 *   same nightly sweep on demand. Delegates to CustomerInactivityService; returns
 *   unwrapped Result data.
 */

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { CustomerInactivityService } from '../application/customer-inactivity.service';

const SD_WRITE_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Sd Customers')
@ApiBearerAuth()
@Controller('sd/customers/inactivity')
export class SdCustomerInactivityController {
  constructor(private readonly svc: CustomerInactivityService) {}

  @ApiOperation({ summary: 'List inactive-customer thresholds (A=90/B=60/C=30)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rules')
  async rules() {
    return unwrapOrThrow(await this.svc.getRules());
  }

  @ApiOperation({ summary: 'Run inactive-customer sweep now (manual trigger)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post('refresh')
  @Roles(...SD_WRITE_ROLES)
  async refresh() {
    return unwrapOrThrow(await this.svc.refresh());
  }
}
