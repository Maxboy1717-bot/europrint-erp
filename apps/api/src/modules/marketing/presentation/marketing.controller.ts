/**
 * @module marketing.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, InternalServerErrorException} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { CurrentUser} from '@common/decorators/current-user.decorator';
import { CreateCampaignCommand} from '../application/commands/create-campaign.command';
import { UpdateCampaignCommand} from '../application/commands/update-campaign.command';
import { LaunchCampaignCommand} from '../application/commands/launch-campaign.command';
import { GetCampaignsQuery} from '../application/queries/get-campaigns.query';
import { GetCampaignQuery} from '../application/queries/get-campaign.query';
import { CreateCampaignDto, UpdateCampaignDto} from './dto/campaign.dto';
import { CampaignsService } from '../campaigns/campaigns.service';

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 SALES_MANAGER = 'sales_manager',
}

@ApiThrottle()
@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class MarketingController {
  private readonly logger = new Logger(MarketingController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus,
 private readonly campaignsSvc: CampaignsService) {}

 @ApiOperation({ summary: 'Get all' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
 async getAll(
 @Query('status') status?: string,
 @Query('page') page?: string,
 @Query('limit') limit?: string) {
 const filters = {
 status,
 page: page ? parseInt(page, 10) : 1,
 limit: limit ? parseInt(limit, 10) : 10,
};

 const result = await this.campaignsSvc.findAll(filters);
 assertOk(result);
 const data = result.data as unknown;
 if (data && typeof data === 'object' && !Array.isArray(data) && 'items' in (data as object)) {
   return (data as { items: unknown[] }).items;
 }
 return data;
}

 @ApiOperation({ summary: 'Get by id' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
 async getById(@Param('id') id: string) {
 // Canonical = marketing_campaigns (owner 2026-06-05) — same table list/delete read. id is a uuid (varchar).
 return await this.campaignsSvc.findOne(id);
}

 @ApiOperation({ summary: 'Create' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
 async create(
 @Body() dto: CreateCampaignDto,
 @CurrentUser() user: AuthenticatedUser) {
 // Canonical = marketing_campaigns (owner 2026-06-05). The CQRS create-campaign path persisted the
 // orphan `campaigns` (uuid) table the FE never reads (and its created_by uuid is incompatible with
 // integer user-ids). Route through campaignsSvc so the row lands where list/detail read, preserving
 // name/description/type/platform/status/budget/dates.
 const created = unwrapOrThrow(await this.campaignsSvc.create(dto as unknown as Record<string, unknown>, user.id));
 this.logger.log('Campaign created');
 return created;
}

 @ApiOperation({ summary: 'Update' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Patch(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
 async update(
 @Param('id') id: string,
 @Body() dto: UpdateCampaignDto,
 @CurrentUser() user: AuthenticatedUser) {
 void user;
 const updated = unwrapOrThrow(await this.campaignsSvc.update(id, dto as unknown as Record<string, unknown>));
 this.logger.log('Campaign updated');
 return updated;
}

 @ApiOperation({ summary: 'Remove' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Delete(':id')
 @HttpCode(HttpStatus.OK)
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 @UseInterceptors(AuditInterceptor)
 async remove(@Param('id') id: string) {
   return unwrapOrThrow(await this.campaignsSvc.remove(id));
 }

 @ApiOperation({ summary: 'Launch' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post(':id/launch')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER)
 async launch(
 @Param('id') id: string,
 @CurrentUser() user: AuthenticatedUser) {
 void user;
 // Launch = activate the campaign (status -> active) on the canonical marketing_campaigns row.
 const launched = unwrapOrThrow(await this.campaignsSvc.update(id, { status: 'active' }));
 this.logger.log('Campaign launched');
 return launched;
}
}
