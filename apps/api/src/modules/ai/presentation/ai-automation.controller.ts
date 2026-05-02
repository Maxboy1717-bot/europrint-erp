import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {Controller, Post, Get, UseGuards, HttpCode, HttpStatus, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AiAutomationService } from '../services/ai-automation.service';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('AI — Automation')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('ai/automation')
export class AiAutomationController {
  private readonly logger = new Logger(AiAutomationController.name);
  constructor(private readonly automation: AiAutomationService) {}

  @Get('status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'director')
  @ApiOperation({ summary: 'AI avtomatizatsiya holati va qamrov statistikasi' })
  async getStatus() {
    return unwrapOrInternal(await this.automation.getAutomationStatus());
  }

  @Post('run-all-pending')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Barcha pending AI ishlarni darhol ishga tushirish (admin)' })
  async runAllPending() {
    return unwrapOrInternal(await this.automation.runAllPendingJobs());
  }
}
