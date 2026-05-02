import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '@common/guards/roles.guard';
import { Roles }       from '@common/decorators/roles.decorator';
import { unwrapOrBadRequest, unwrapOrNotFound } from '@common/http-result';
import { MarketingExtService } from '../application/marketing-ext.service';
import {
  CreateContentPostDtoSchema, CreateContentPostDto,
  UpdateContentPostDtoSchema, UpdateContentPostDto,
  CreateSocialAccountDtoSchema, CreateSocialAccountDto,
} from './dto/marketing-ext.dto';

@ApiTags('§17 Marketing Content')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingContentController {
  private readonly logger = new Logger(MarketingContentController.name);

  constructor(private readonly svc: MarketingExtService) {}

  @Get('campaigns/:id/stats')
  @ApiOperation({ summary: 'Kampaniya statistikasi' })
  async getCampaignStats(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCampaignStats(Number(id)));
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Marketing dashboard statistikasi' })
  async getDashboardStats() {
    return unwrapOrBadRequest(await this.svc.getDashboardStats());
  }

  @Get('content/posts')
  @ApiOperation({ summary: "Kontent postlar ro'yxati" })
  async getContentPosts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrBadRequest(await this.svc.getContentPosts(Number(page), Number(limit)));
  }

  @Post('content/posts')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi kontent post yaratish' })
  async createContentPost(@Body() body: CreateContentPostDto) {
    const dto = CreateContentPostDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createContentPost(dto));
  }

  @Get('content/posts/:id')
  @ApiOperation({ summary: 'Kontent post tafsiloti' })
  async getContentPost(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getContentPostById(id));
  }

  @Put('content/posts/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Kontent postni yangilash' })
  async updateContentPost(@Param('id') id: string, @Body() body: UpdateContentPostDto) {
    const dto = UpdateContentPostDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateContentPost(id, dto));
  }

  @Delete('content/posts/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Kontent postni o'chirish" })
  async deleteContentPost(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteContentPost(id));
  }

  @Post('content/posts/:id/publish')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Kontent postni e'lon qilish" })
  async publishContentPost(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.publishContentPost(id));
  }

  @Get('content/calendar')
  @ApiOperation({ summary: 'Kontent kalendari' })
  async getContentCalendar() {
    return unwrapOrBadRequest(await this.svc.getContentCalendar());
  }

  @Get('content/analytics')
  @ApiOperation({ summary: 'Kontent analitikasi' })
  async getContentAnalytics() {
    return unwrapOrBadRequest(await this.svc.getContentAnalytics());
  }

  @Get('social/accounts')
  @ApiOperation({ summary: 'Ijtimoiy tarmoq akkauntlari' })
  async getSocialAccounts() {
    return unwrapOrBadRequest(await this.svc.getSocialAccounts());
  }

  @Post('social/accounts')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Ijtimoiy tarmoq akkaunti qo'shish" })
  async createSocialAccount(@Body() body: CreateSocialAccountDto) {
    const dto = CreateSocialAccountDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createSocialAccount(dto));
  }

  @Delete('social/accounts/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Ijtimoiy tarmoq akkaunti o'chirish" })
  async deleteSocialAccount(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteSocialAccount(id));
  }
}
