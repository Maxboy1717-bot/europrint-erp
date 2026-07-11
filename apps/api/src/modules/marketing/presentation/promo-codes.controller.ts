/**
 * @module promo-codes.controller
 * @description Marketing promo-code CRUD (vision-1000-answers/14-marketing.md #20 --
 *   "Promo-kod 1 mijoz / 1 kampaniya bo'yicha cheklangan (default)...").
 *   Rule 3: @Body() validated with Zod. Rule 6: controller delegates to service, no
 *   business logic here. Styled after presentation/marketing-group2.controller.ts (same
 *   module, same minimal-CRUD shape).
 */

import {
  Controller, Get, Post, Delete,
  Param, Body, Query,
  UseGuards, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { PromoCodesService } from '../promo-codes/promo-codes.service';

const CreatePromoCodeSchema = z.object({
  code: z.string().min(3).max(64),
  campaignId: z.string().min(1).max(36),
  customerId: z.coerce.number().int().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
}).strict();

@ApiTags('§17 Marketing Promo Codes')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/promo-codes')
@Roles('super_admin', 'director', 'marketing_manager')
export class PromoCodesController {
  private readonly logger = new Logger(PromoCodesController.name);

  constructor(private readonly svc: PromoCodesService) {}

  @Get()
  @ApiOperation({ summary: "Promo-kodlar ro'yxati (campaignId filter)" })
  async findAll(@Query('campaignId') campaignId?: string) {
    return unwrapOrThrow(await this.svc.findAll(campaignId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Promo-kod tafsiloti' })
  async findOne(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.findOne(Number(id)));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Yangi promo-kod yaratish (default: 1 mijoz / 1 kampaniya)" })
  async create(@Body() body: unknown) {
    const dto = CreatePromoCodeSchema.parse(body);
    const created = unwrapOrThrow(await this.svc.create(dto));
    this.logger.log('Promo code created');
    return created;
  }

  @Post(':id/redeem')
  @ApiOperation({ summary: "Promo-kodni ishlatish (usage_limit ichida bo'lsa used_count +1)" })
  async redeem(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.redeem(Number(id)));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Promo-kodni o'chirish" })
  async remove(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.remove(Number(id)));
  }
}
