/**
 * @module ecommerce-public.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, Get, Post, Body, Param, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Public } from '../../common/decorators/public.decorator';
import { EcommerceService } from './ecommerce.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  EcommerceBodySchema, EcommerceBodyDto,
  PublicContactSchema, PublicContactDto,
} from './dto/ecommerce.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Ecommerce - Public')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller()
export class EcommercePublicController {
  private readonly logger = new Logger(EcommercePublicController.name);

  constructor(private readonly svc: EcommerceService) {}

  @Public()
  @ApiOperation({ summary: 'Get public categories' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('public/categories')
  async getPublicCategories() {
    return unwrapOrInternal(await this.svc.getPublicCategories());
  }

  @Public()
  @ApiOperation({ summary: 'Create public order' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('public/orders')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async createPublicOrder(@Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.createPublicOrderFromBody(body, this.logger));
  }

  @Public()
  @ApiOperation({ summary: 'Get public product' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('public/products/:slug')
  async getPublicProduct(@Param('slug') slug: string) {
    return unwrapOrInternal(await this.svc.getPublicProductBySlug(slug));
  }

  /**
   * Trigger 22 — Saytda aloqa formasi (yoki AI chatbot).
   * Lead avtomatik CRM ga tushadi (WebsiteContactLeadListener).
   */
  @Public()
  @ApiOperation({ summary: 'Submit public contact' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('public/contact')
  @UsePipes(new ZodValidationPipe(PublicContactSchema))
  async submitPublicContact(@Body() body: PublicContactDto) {
    this.svc.emitWebsiteContact({
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      message: body.message ?? null,
      channel: body.channel,
    });
    return { ok: true, accepted: true };
  }
}
