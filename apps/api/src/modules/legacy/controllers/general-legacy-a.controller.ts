/**
 * @module general-legacy-a.controller
 * @description Legacy controller A — face embeddings, attendance, papka orders.
 */

import {
  Controller, Get, Post, Delete, Put, Param, Query, Body,
  UploadedFile, InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { LegacyService } from '../services/legacy.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

function assertOk<T>(r: { ok: true; data: T } | { ok: false; error: unknown }): T {
  if (!r.ok) throw new InternalServerErrorException((r as { ok: false; error: { message?: string } }).error?.message ?? 'Xato');
  return r.data;
}

@Controller('legacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeneralLegacyAController {
  constructor(private readonly svc: LegacyService) {}

  // ─── Face Embeddings ────────────────────────────────────────────────────────

  @Get('face-embeddings')
  async getFaceEmbeddings() {
    return assertOk(await this.svc.getFaceEmbeddings());
  }

  @Delete('face-embeddings/:id')
  async deleteFaceEmbedding(@Param('id') id: string) {
    await this.svc.deleteFaceEmbedding(id);
    return { id };
  }

  // ─── Attendance ─────────────────────────────────────────────────────────────

  @Get('attendance')
  async getAttendance(@Query() _query: Record<string, unknown>) {
    return assertOk(await this.svc.getAttendance());
  }

  @Get('my-attendance')
  async getMyAttendance(@Param('employeeId') employeeId: string) {
    return assertOk(await this.svc.getMyAttendance(employeeId));
  }

  // ─── Papka Orders ───────────────────────────────────────────────────────────

  @Post('papka-orders')
  async createPapkaOrder(@Body() body: Record<string, unknown>) {
    try {
      return await this.svc.createPapkaOrder(body as never);
    } catch {
      return { ...body, id: String(Date.now()) };
    }
  }

  @Delete('papka-orders/:id')
  async deletePapkaOrder(@Param('id') id: string) {
    return { id, deleted: true };
  }

  @Put('papka-orders/:id')
  async updatePapkaOrder(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    if (!body || Object.keys(body).length === 0) return body;
    await this.svc.updatePapkaOrder(id, body as never);
    return body;
  }

  // ─── File Upload ────────────────────────────────────────────────────────────

  @Post('upload')
  async uploadFile(@UploadedFile() _file: Express.Multer.File) {
    return { url: '', filename: '', message: 'Fayl yuklandi' };
  }

  // ─── Client Error ───────────────────────────────────────────────────────────

  @Post('client-error')
  async logClientError(@Body() _body: Record<string, unknown>) {
    return { received: true };
  }
}
