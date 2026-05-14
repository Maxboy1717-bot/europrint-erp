/**
 * @module ecommerce-public.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, Get, Post, Body, Param, Logger, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { EcommerceService } from './ecommerce.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  EcommerceBodySchema, EcommerceBodyDto,
  PublicContactSchema, PublicContactDto,
} from './dto/ecommerce.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Ecommerce - Public')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller()
export class EcommercePublicController {
  private readonly logger = new Logger(EcommercePublicController.name);

  constructor(private readonly svc: EcommerceService) {}

  @Public()
  @Get('public/categories')
  async getPublicCategories() {
    return unwrapOrInternal(await this.svc.getPublicCategories());
  }

  @Public()
  @Post('public/orders')
  @UsePipes(new ZodValidationPipe(EcommerceBodySchema))
  async createPublicOrder(@Body() body: EcommerceBodyDto) {
    return unwrapOrInternal(await this.svc.createPublicOrderFromBody(body, this.logger));
  }

  @Public()
  @Get('public/products/:slug')
  async getPublicProduct(@Param('slug') slug: string) {
    return unwrapOrInternal(await this.svc.getPublicProductBySlug(slug));
  }

  /**
   * Trigger 22 — Saytda aloqa formasi (yoki AI chatbot).
   * Lead avtomatik CRM ga tushadi (WebsiteContactLeadListener).
   */
  @Public()
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
