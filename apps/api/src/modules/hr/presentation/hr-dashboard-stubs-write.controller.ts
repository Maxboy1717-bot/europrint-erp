/**
 * @module hr-dashboard-stubs-write.controller
 * @description Write-side stub endpoints (POST/PATCH/PUT) extracted from
 * hr-dashboard-stubs.controller.ts per Rule 16 (≤ 300 lines). Same `/hr` prefix
 * and roles guard as the read sibling. Bodies are still Zod-validated so
 * shape errors return 400 honestly, but the handlers themselves return 501.
 */

import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PassthroughSchema, notImplemented } from './hr-dashboard-stubs-common';

@ApiThrottle()
@ApiTags('Hr Dashboard Stubs Write')
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrDashboardStubsWriteController {

  @ApiOperation({ summary: 'Invite alumni' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('alumni/:id/invite')
  @HttpCode(HttpStatus.OK)
  inviteAlumni(@Param('id') _id: string, @Body() _body: unknown) {
    return notImplemented('POST /hr/alumni/:id/invite');
  }

  @ApiOperation({ summary: 'Post calculate abc analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('abc-analysis/:id/calculate')
  @HttpCode(HttpStatus.OK)
  postCalculateAbcAnalysis(@Param('id') _id: string) {
    return notImplemented('POST /hr/abc-analysis/:id/calculate');
  }

  @ApiOperation({ summary: 'Patch adaptation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('adaptation/:id')
  patchAdaptation(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/adaptation/:id');
  }

  @ApiOperation({ summary: 'Patch ai interview session review' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('ai-interview/session/:id/review')
  patchAiInterviewSessionReview(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/ai-interview/session/:id/review');
  }

  @ApiOperation({ summary: 'Put birthday settings by id' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('birthdays/settings/:id')
  putBirthdaySettingsById(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PUT /hr/birthdays/settings/:id');
  }

  @ApiOperation({ summary: 'Create offboarding case' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('offboarding/cases')
  @HttpCode(HttpStatus.CREATED)
  createOffboardingCase(@Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('POST /hr/offboarding/cases');
  }

  @ApiOperation({ summary: 'Create onboarding checklist' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('onboarding-checklists')
  @HttpCode(HttpStatus.CREATED)
  createOnboardingChecklist(@Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('POST /hr/onboarding-checklists');
  }

  @ApiOperation({ summary: 'Patch onboarding checklist' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('onboarding-checklists/:id')
  @HttpCode(HttpStatus.OK)
  patchOnboardingChecklist(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/onboarding-checklists/:id');
  }

  @ApiOperation({ summary: 'Patch referral' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('referrals/:id')
  @HttpCode(HttpStatus.OK)
  patchReferral(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/referrals/:id');
  }
}
