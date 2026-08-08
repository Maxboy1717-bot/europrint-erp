/**
 * @module customer-rhythm.controller
 * @description Customer purchase-rhythm endpoint (vision 14-marketing #11).
 *   Rule 6: transport-only — delegates to CustomerRhythmService.
 *   Rule 8: guarded (JwtAuthGuard + RolesGuard).
 */

import {
  Controller, Get, Param, UseGuards, Logger, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { CustomerRhythmService } from '../application/customer-rhythm.service';

@Controller('marketing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerRhythmController {
  private readonly logger = new Logger(CustomerRhythmController.name);

  constructor(private readonly svc: CustomerRhythmService) {}

  /**
   * GET /api/marketing/customers/:customerId/rhythm
   * Average days between orders for a customer, only after the first N orders.
   */
  @Get('customers/:customerId/rhythm')
  @Roles('super_admin', 'marketing_manager', 'manager', 'director')
  async getCustomerRhythm(@Param('customerId') customerId: string) {
    const id = Number.parseInt(customerId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('customerId musbat butun son bo\'lishi kerak');
    }
    return unwrapOrThrow(await this.svc.getCustomerRhythm(id));
  }
}
