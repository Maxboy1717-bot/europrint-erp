/**
 * @module website-media.controller
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
  WebsiteCreateBannerSchema, WebsiteCreateBannerDto,
  WebsiteUpdateBannerSchema, WebsiteUpdateBannerDto,
  WebsiteCreatePortfolioSchema, WebsiteCreatePortfolioDto,
  WebsiteUpdatePortfolioSchema, WebsiteUpdatePortfolioDto,
} from './dto/website.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Website Media')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller()
export class WebsiteMediaController {
  private readonly logger = new Logger(WebsiteMediaController.name);

  constructor(private readonly svc: WebsiteService) {}

  @Public()
  @ApiOperation({ summary: 'Get website banners' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('website/banners')
  async getWebsiteBanners(@Query('position') position: string) {
    return unwrapOrInternal(await this.svc.listBanners(position || undefined));
  }

  @ApiOperation({ summary: 'Create website banner' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('website/banners')
  @UsePipes(new ZodValidationPipe(WebsiteCreateBannerSchema))
  async createWebsiteBanner(@Body() body: WebsiteCreateBannerDto) {
    return unwrapOrInternal(await this.svc.createBanner(body));
  }

  @ApiOperation({ summary: 'Update website banner' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('website/banners/:id')
  @UsePipes(new ZodValidationPipe(WebsiteUpdateBannerSchema))
  async updateWebsiteBanner(@Param('id') id: string, @Body() body: WebsiteUpdateBannerDto) {
    return unwrapOrInternal(await this.svc.updateBanner(Number(id), body));
  }

  @ApiOperation({ summary: 'Delete website banner' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('website/banners/:id')
  @Roles('admin', 'hr')
  deleteWebsiteBanner() {
    throw new HttpException(
      { error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" },
      HttpStatus.FORBIDDEN,
    );
  }

  @Public()
  @ApiOperation({ summary: 'Get portfolio items' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('website/portfolio')
  async getPortfolioItems() {
    return unwrapOrInternal(await this.svc.listPortfolio());
  }

  @ApiOperation({ summary: 'Create portfolio item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('website/portfolio')
  @UsePipes(new ZodValidationPipe(WebsiteCreatePortfolioSchema))
  async createPortfolioItem(@Body() body: WebsiteCreatePortfolioDto) {
    return unwrapOrInternal(await this.svc.createPortfolioItem(body));
  }

  @ApiOperation({ summary: 'Update portfolio item' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('website/portfolio/:id')
  @UsePipes(new ZodValidationPipe(WebsiteUpdatePortfolioSchema))
  async updatePortfolioItem(@Param('id') id: string, @Body() body: WebsiteUpdatePortfolioDto) {
    return unwrapOrInternal(await this.svc.updatePortfolioItem(Number(id), body));
  }

  @ApiOperation({ summary: 'Delete portfolio item' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Delete('website/portfolio/:id')
  @Roles('admin', 'hr')
  deletePortfolioItem() {
    throw new HttpException(
      { error: "O'chirish taqiqlangan", message: "Audit compliance uchun bu yozuv o'chirib bo'lmaydi" },
      HttpStatus.FORBIDDEN,
    );
  }

  @Public()
  @ApiOperation({ summary: 'Get news' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('website/news')
  async getNews() {
    return unwrapOrInternal(await this.svc.listNews());
  }
}
