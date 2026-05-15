/**
 * @module recruitment-offers.controller
 * @description Job-offers & references-check routes split from recruitment.controller.
 * Same `hr/recruitment` prefix.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RecruitmentService } from './recruitment.service';
import { CreateReferencesCheckDto, UpdateReferencesCheckDto } from './dto/references-check.dto';
import { CreateJobOfferDto, UpdateJobOfferStatusDto } from './dto/job-offer.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('HR Rekruter')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('hr/recruitment')
export class RecruitmentOffersController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ──────────────────── REFERENCES CHECK ──────────────────────────────────

  @Post('references-check')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Navedenie spravok — oldingi ish joyiga qo\'ng\'iroq natijasini saqlash' })
  @ApiResponse({ status: 201, description: 'Reference Check yozuvi yaratildi' })
  async createReferencesCheck(
    @Body() dto: CreateReferencesCheckDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.createReferencesCheck(dto, user.id));
  }

  @Get('references-check/funnel/:funnelId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Funnel bo\'yicha barcha reference check yozuvlari' })
  async getReferencesChecksByFunnel(@Param('funnelId', ParseIntPipe) funnelId: number) {
    return unwrapOrInternal(await this.recruitmentService.getReferencesChecksByFunnel(funnelId));
  }

  @Patch('references-check/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Reference Check natijasini yangilash' })
  async updateReferencesCheck(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReferencesCheckDto,
  ) {
    return unwrapOrInternal(await this.recruitmentService.updateReferencesCheck(id, dto));
  }

  // ──────────────────────── JOB OFFER ─────────────────────────────────────

  @Post('job-offer')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Ish taklifi (Job Offer) yaratish' })
  @ApiResponse({ status: 201, description: 'Job Offer yaratildi' })
  async createJobOffer(
    @Body() dto: CreateJobOfferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.createJobOffer(dto, user.id));
  }

  @Get('job-offer/candidate/:candidateId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Nomzodning barcha Job Offer\'lari' })
  async getJobOffersByCandidate(@Param('candidateId', ParseIntPipe) candidateId: number) {
    return unwrapOrInternal(await this.recruitmentService.getJobOffersByCandidate(candidateId));
  }

  @Get('job-offer/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Bitta Job Offer ma\'lumotlari' })
  async getJobOfferById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.recruitmentService.getJobOfferById(id));
  }

  @Patch('job-offer/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr_manager', 'hr', 'hr_recruiter')
  @ApiOperation({ summary: 'Job Offer statusini yangilash (SENT / ACCEPTED / DECLINED / EXPIRED)' })
  async updateJobOfferStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobOfferStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return unwrapOrInternal(await this.recruitmentService.updateJobOfferStatus(id, dto));
  }
}
