/**
 * @module website.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, Logger, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { WebsiteService } from './website.service';
import {
  WebsiteUpsertSettingSchema, WebsiteUpsertSettingDto,
  WebsiteCreatePageSchema, WebsiteCreatePageDto,
  WebsiteUpdatePageSchema, WebsiteUpdatePageDto,
} from './dto/website.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Website')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller()
export class WebsiteController {
  private readonly logger = new Logger(WebsiteController.name);

  constructor(private readonly svc: WebsiteService) {}

  @Public()
  @Get('website/settings')
  async getWebsiteSettings(@Query('category') category: string) {
    return unwrapOrInternal(await this.svc.getSettings(category || undefined));
  }

  @Put('website/settings/:key')
  @UsePipes(new ZodValidationPipe(WebsiteUpsertSettingSchema))
  async updateWebsiteSetting(@Param('key') key: string, @Body() body: WebsiteUpsertSettingDto) {
    return unwrapOrInternal(await this.svc.upsertSetting(key, body));
  }

  @Public()
  @Get('website/pages')
  async getWebsitePages(@Query('type') type: string) {
    return unwrapOrInternal(await this.svc.listPages(type || undefined));
  }

  @Post('website/pages')
  @UsePipes(new ZodValidationPipe(WebsiteCreatePageSchema))
  async createWebsitePage(@Body() body: WebsiteCreatePageDto) {
    return unwrapOrInternal(await this.svc.createPage(body));
  }

  @Put('website/pages/:id')
  @UsePipes(new ZodValidationPipe(WebsiteUpdatePageSchema))
  async updateWebsitePage(@Param('id') id: string, @Body() body: WebsiteUpdatePageDto) {
    return unwrapOrInternal(await this.svc.updatePage(Number(id), body));
  }

  @Delete('website/pages/:id')
  @Roles('admin', 'hr')
  deleteWebsitePage() {
    throw new HttpException(
      { error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" },
      HttpStatus.FORBIDDEN,
    );
  }
}
