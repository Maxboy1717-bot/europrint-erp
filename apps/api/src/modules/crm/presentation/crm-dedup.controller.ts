/**
 * @module crm-dedup.controller
 * @description NestJS controller (transport-only). Phone-dedup endpoints:
 *   GET  /crm/lead-dedup/duplicates — list lead groups sharing a phone
 *   POST /crm/lead-dedup/merge      — merge a duplicate lead into a canonical one
 * Delegates all logic to CrmDedupService; returns Result via unwrapOrThrow.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Body, Controller, Get, Post, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { unwrapOrThrow } from '@common/http-result';
import { CrmDedupService } from '../application/crm-dedup.service';
import { MergeLeadsDtoSchema, MergeLeadsDto } from './dto/crm-dedup.dto';

// Same write-privileged roles the sibling CrmLeadsOpsController uses.
// 'manager' — SD-CRM audit §3.2 (2026-07-10): live users seed 'manager', not 'sales_manager'.
const CRM_DEDUP_ROLES = ['sales_manager', 'manager', 'super_admin', 'director', 'crm_manager'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Crm Lead Dedup')
@Controller('crm/lead-dedup')
@UseGuards(RolesGuard)
@Roles(...CRM_DEDUP_ROLES)
export class CrmDedupController {
  constructor(private readonly service: CrmDedupService) {}

  @ApiOperation({ summary: 'List phone-duplicate lead groups' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('duplicates')
  async duplicates() {
    const r = await this.service.getDuplicates();
    return unwrapOrThrow(r);
  }

  @ApiOperation({ summary: 'Merge a duplicate lead into a canonical lead' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  @Post('merge')
  @UsePipes(new ZodValidationPipe(MergeLeadsDtoSchema))
  async merge(@Body() body: MergeLeadsDto) {
    const r = await this.service.merge(body.canonicalLeadId, body.duplicateLeadId);
    return unwrapOrThrow(r);
  }
}
