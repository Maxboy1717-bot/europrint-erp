/**
 * @module website.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus, Logger, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { WebsiteService } from './website.service';
import {
  WebsiteUpsertSettingSchema, WebsiteUpsertSettingDto,
  WebsiteCreatePageSchema, WebsiteCreatePageDto,
  WebsiteUpdatePageSchema, WebsiteUpdatePageDto,
} from './dto/website.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Website')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller()
export class WebsiteController {
  private readonly logger = new Logger(WebsiteController.name);

  constructor(private readonly svc: WebsiteService) {}

  @Public()
  @ApiOperation({ summary: 'Get website settings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('website/settings')
  async getWebsiteSettings(@Query('category') category: string) {
    return unwrapOrInternal(await this.svc.getSettings(category || undefined));
  }

  @ApiOperation({ summary: 'Update website setting' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('website/settings/:key')
  @UsePipes(new ZodValidationPipe(WebsiteUpsertSettingSchema))
  async updateWebsiteSetting(@Param('key') key: string, @Body() body: WebsiteUpsertSettingDto) {
    return unwrapOrInternal(await this.svc.upsertSetting(key, body));
  }

  @Public()
  @ApiOperation({ summary: 'Get website pages' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('website/pages')
  async getWebsitePages(@Query('type') type: string) {
    return unwrapOrInternal(await this.svc.listPages(type || undefined));
  }

  @ApiOperation({ summary: 'Create website page' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('website/pages')
  @UsePipes(new ZodValidationPipe(WebsiteCreatePageSchema))
  async createWebsitePage(@Body() body: WebsiteCreatePageDto) {
    return unwrapOrInternal(await this.svc.createPage(body));
  }

  @ApiOperation({ summary: 'Update website page' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('website/pages/:id')
  @UsePipes(new ZodValidationPipe(WebsiteUpdatePageSchema))
  async updateWebsitePage(@Param('id') id: string, @Body() body: WebsiteUpdatePageDto) {
    return unwrapOrInternal(await this.svc.updatePage(Number(id), body));
  }

  @ApiOperation({ summary: 'Delete website page' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('website/pages/:id')
  @Roles('admin', 'hr')
  deleteWebsitePage() {
    throw new HttpException(
      { error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" },
      HttpStatus.FORBIDDEN,
    );
  }
}
