/**
 * @module inspection.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, UseInterceptors, Request,
  NotFoundException, InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { InspectionService } from './inspection.service';
import { InspectionRepository } from './inspection.repository';
import {
  UploadReferencePhotoSchema, UploadReferencePhotoDto,
  ManualInspectionSchema, ManualInspectionDto,
  ChecklistSchema, ChecklistDto,
} from './dto/inspection.dto';

const REFERENCE_PHOTO_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR']             as const;
const MANUAL_INSPECTION_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR', 'SECURITY'] as const;
const CHECKLIST_ROLES         = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR', 'SECURITY'] as const;
const READ_ROLES              = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_DIRECTOR', 'DEPT_HEAD'] as const;

type AuthReq = { user?: { id?: number | string } };

@Throttle({ default: { limit: 60, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Inspection')
@ApiBearerAuth()
@Controller('hr/inspection')
export class InspectionController {
  constructor(
    private readonly svc:  InspectionService,
    private readonly repo: InspectionRepository,
  ) {}

  @ApiOperation({ summary: 'Upload reference photo' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('rooms/:roomCode/reference-photo')
  @Roles(...REFERENCE_PHOTO_ROLES)
  @UsePipes(new ZodValidationPipe(UploadReferencePhotoSchema))
  async uploadReferencePhoto(
    @Param('roomCode') roomCode: string,
    @Body() body: UploadReferencePhotoDto,
    @Request() req: AuthReq,
  ) {
    const uploadedBy = String(req.user?.id ?? '');
    const roomName   = body.room_name ?? roomCode;
    const r = await this.svc.uploadReferencePhoto(
      roomCode, body.image_base64, roomName, uploadedBy || undefined, body.description,
    );
    if (!r.ok) throw new InternalServerErrorException('Referans rasm saqlashda xato');
    return { ok: true, data: r.data ?? {} };
  }

  @ApiOperation({ summary: 'Get rooms' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms')
  @Roles(...READ_ROLES)
  async getRooms() {
    const r = await this.svc.getRooms();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get room history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rooms/:roomCode/history')
  @Roles(...READ_ROLES)
  async getRoomHistory(
    @Param('roomCode') roomCode: string,
    @Query('days')   days:   string,
    @Query('limit')  limit:  string,
    @Query('offset') offset: string,
  ) {
    const daysNum   = Math.min(90, Math.max(1, parseInt(days   ?? '7',  10) || 7));
    const limitNum  = Math.min(200, Math.max(1, parseInt(limit  ?? '50', 10) || 50));
    const offsetNum = Math.max(0, parseInt(offset ?? '0', 10) || 0);
    const r = await this.svc.getRoomHistory(roomCode, daysNum, limitNum, offsetNum);
    if (!r.ok) return { items: [], total: 0 };
    const { items, total } = r.data as { items: unknown[]; total: number };
    return { items, total };
  }

  @ApiOperation({ summary: 'Create manual inspection' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('manual')
  @Roles(...MANUAL_INSPECTION_ROLES)
  @UsePipes(new ZodValidationPipe(ManualInspectionSchema))
  async createManualInspection(
    @Body() body: ManualInspectionDto,
    @Request() req: AuthReq,
  ) {
    const inspectorId = String(req.user?.id ?? '');
    const r = await this.svc.createManualInspection(body, inspectorId || undefined);
    if (!r.ok) throw new InternalServerErrorException('Inspeksiya saqlashda xato');
    return { ok: true, data: r.data ?? {} };
  }

  @ApiOperation({ summary: 'Submit checklist' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('checklist')
  @Roles(...CHECKLIST_ROLES)
  @UsePipes(new ZodValidationPipe(ChecklistSchema))
  async submitChecklist(
    @Body() body: ChecklistDto,
    @Request() req: AuthReq,
  ) {
    const inspectorId = String(req.user?.id ?? '');
    const r = await this.svc.submitChecklist(body, inspectorId || undefined);
    if (!r.ok) throw new InternalServerErrorException('Chek-list saqlashda xato');
    return { ok: true, data: r.data ?? {} };
  }

  @ApiOperation({ summary: 'Get checklist pdf' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('checklist-pdf/:id')
  @Roles(...READ_ROLES)
  async getChecklistPdf(@Param('id') id: string) {
    const analysisResult = await this.repo.findAnalysisById(id);
    if (!analysisResult.ok || !analysisResult.data) {
      throw new NotFoundException(`Checklist ${id} topilmadi`);
    }
    const analysis = analysisResult.data as Record<string, unknown>;
    const storedUrl = analysis['pdf_url'] ? String(analysis['pdf_url']) : null;
    if (!storedUrl) {
      throw new NotFoundException(`Bu tahlil uchun PDF hali tayyorlanmagan (ID: ${id})`);
    }
    return { pdf_url: storedUrl, analysis_id: id };
  }

  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts')
  @Roles(...READ_ROLES)
  async getAlerts(@Query('hours') hours: string) {
    const h = Math.min(168, Math.max(1, parseInt(hours ?? '48', 10) || 48));
    const r = await this.svc.getAlerts(h);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }
}
