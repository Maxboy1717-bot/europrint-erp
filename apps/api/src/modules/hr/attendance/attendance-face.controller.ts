import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FaceRecognitionService } from './face-recognition.service';
import { TerritoryLogService, CameraEventDto } from './territory-log.service';
import { LateArrivalService } from './late-arrival.service';

class RegisterFaceDto {
  employee_id!: string;
  /** Preferred: send 3 images for enrollment with automatic embedding averaging */
  images?: string[];
  /** Legacy single-embedding path (backward compat) */
  embedding?: number[];
  confidence?: number;
  image_url?: string;
}

class CameraEventBodyDto implements CameraEventDto {
  image_base64?: string;
  embedding?: number[];
  event_type!: 'enter' | 'exit' | 'detected' | 'absent_check';
  camera_id?: string;
  room_code?: string;
  face_confidence?: number;
  ts?: string;
}

@Throttle({ default: { limit: 200, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'admin', 'security', 'SECURITY')
@UseInterceptors(AuditInterceptor)
@Controller('hr/attendance')
export class AttendanceFaceController {
  private readonly logger = new Logger(AttendanceFaceController.name);

  constructor(
    private readonly faceRec:     FaceRecognitionService,
    private readonly territory:   TerritoryLogService,
    private readonly lateArrival: LateArrivalService,
  ) {}

  @Post('face/register')
  @HttpCode(HttpStatus.OK)
  async registerFace(@Body() dto: RegisterFaceDto) {
    if ((dto.images ?? []).length > 0) {
      if (dto.images!.length !== 3) {
        throw new BadRequestException(
          `Face enrollment requires exactly 3 images; received ${dto.images!.length}`,
        );
      }
      const result = await this.faceRec.registerEmbeddingFromImages(
        dto.employee_id,
        dto.images!,
      );
      if (!result.ok) {
        return { ok: false, error: String(result.error) };
      }
      return { ok: true, face_id: result.data.id, method: '3-image' };
    }

    const result = await this.faceRec.registerEmbedding(
      dto.employee_id,
      dto.embedding ?? [],
      dto.confidence ?? 0,
      dto.image_url,
    );
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return { ok: true, face_id: result.data.id, method: 'single-embedding' };
  }

  @Post('territory')
  @HttpCode(HttpStatus.OK)
  async cameraEvent(@Body() dto: CameraEventBodyDto) {
    const result = await this.territory.handleCameraEvent(dto);
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return {
      ok:             true,
      faces:          result.data.faces,
      total_faces:    result.data.total_faces,
      ai_unavailable: result.data.ai_unavailable,
    };
  }

  @Get('live')
  async getLiveStatus() {
    const result = await this.territory.getLiveStatus();
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return { ok: true, ...result.data };
  }

  @Get('territory/logs')
  async getTerritoryLogs(
    @Query('date')        date?: string,
    @Query('employee_id') employeeId?: string,
  ) {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const empId      = employeeId ? parseInt(employeeId, 10) : undefined;
    const result     = await this.territory.getLogsForDate(targetDate, empId);
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return { ok: true, ...result.data };
  }

  @Get('face/health')
  async faceAiHealth() {
    const result = await this.faceRec.healthCheck();
    if (!result.ok) {
      return { ok: false, status: 'unavailable' };
    }
    return { ok: true, ...result.data };
  }

  @Get('late-arrivals/today')
  async lateArrivalsToday() {
    const result = await this.lateArrival.getLateArrivalsToday();
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return { ok: true, data: result.data ?? [] };
  }
}
