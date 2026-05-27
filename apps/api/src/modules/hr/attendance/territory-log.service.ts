/**
 * @module territory-log.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { safeCall, Result, AppError, Ok, Err } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { TerritoryLogRepository } from './territory-log.repository';
import { FaceRecognitionService } from './face-recognition.service';
import { NotificationBotService } from '../telegram-bots/notification-bot.service';

const WORK_START_HOUR    = 9;
const LATE_GRACE_MINUTES = 10;

export interface CameraEventDto {
  image_base64?: string;
  embedding?:    number[];
  event_type:    'enter' | 'exit' | 'detected' | 'absent_check';
  camera_id?:    string;
  room_code?:    string;
  face_confidence?: number;
  ts?:           string;
}

export interface FaceEventResult {
  log_id:      string;
  employee_id: string | null;
  event_type:  string;
  ts:          string;
  is_late:     boolean;
}

export interface TerritoryEventResult {
  faces:         FaceEventResult[];
  total_faces:   number;
  ai_unavailable: boolean;
}

@Injectable()
export class TerritoryLogService {
  private readonly logger = new Logger(TerritoryLogService.name);
  private readonly time   = new TashkentTimeService();

  constructor(
    private readonly repo:            TerritoryLogRepository,
    private readonly faceRec:         FaceRecognitionService,
    private readonly emitter:         EventEmitter2,
    private readonly notificationBot: NotificationBotService,
  ) {}

  async handleCameraEvent(dto: CameraEventDto): Promise<Result<TerritoryEventResult, AppError>> {
    return safeCall(async () => {
      const eventTs = dto.ts ? new Date(dto.ts) : this.time.now();

      if (dto.embedding && dto.embedding.length > 0) {
        const matchResult = await this.faceRec.matchFace(dto.embedding);
        if (!matchResult.ok) {
          return { faces: [], total_faces: 0, ai_unavailable: true };
        }
        const faceRes = await this._logFaceResult(
          matchResult.data.employee_id,
          matchResult.data.confidence,
          dto,
          eventTs,
        );
        if (!faceRes.ok) return { faces: [], total_faces: 0, ai_unavailable: false };
        return { faces: [faceRes.data], total_faces: 1, ai_unavailable: false };
      }

      if (dto.image_base64) {
        const recResult = await this.faceRec.recognize(dto.image_base64, dto.room_code);
        if (!recResult.ok) {
          this.logger.warn(
            'Face AI unavailable — manual attendance fallback camera=%s ts=%s',
            dto.camera_id ?? '-',
            eventTs.toISOString(),
          );
          return { faces: [], total_faces: 0, ai_unavailable: true };
        }

        const detectedFaces = recResult.data.faces ?? [];
        const results: FaceEventResult[] = [];

        for (const face of detectedFaces) {
          const matchResult = await this.faceRec.matchFace(face.embedding);
          const empId = matchResult.ok ? matchResult.data.employee_id : null;
          const conf  = matchResult.ok ? matchResult.data.confidence : (face.confidence ?? 0);
          const faceResult = await this._logFaceResult(empId, conf, dto, eventTs);
          if (faceResult.ok) results.push(faceResult.data);
        }

        return {
          faces:          results,
          total_faces:    detectedFaces.length,
          ai_unavailable: false,
        };
      }

      return { faces: [], total_faces: 0, ai_unavailable: false };
    });
  }

  private async _logFaceResult(
    employeeIdStr: string | null,
    confidence:    number,
    dto:           CameraEventDto,
    eventTs:       Date,
  ): Promise<Result<FaceEventResult, AppError>> {
    const numericEmployeeId = employeeIdStr ? parseInt(employeeIdStr, 10) : null;
    const isLate = this._isLateArrival(dto.event_type, eventTs);

    if (!numericEmployeeId || isNaN(numericEmployeeId)) {
      await this.repo.insertSecurityAlert({
        camera_id:  dto.camera_id,
        room_code:  dto.room_code,
        event_type: dto.event_type,
        confidence,
        ts:         eventTs,
      });
      this.emitter.emit('security.unknown_face', {
        camera_id:  dto.camera_id,
        room_code:  dto.room_code,
        event_type: dto.event_type,
        ts:         eventTs.toISOString(),
        confidence,
      });

      const securityChatId = process.env['SECURITY_TELEGRAM_CHAT_ID'];
      if (securityChatId) {
        const msg =
          `🚨 *Noma'lum yuz aniqlandi*\n` +
          `📷 Kamera: \`${dto.camera_id ?? '-'}\`\n` +
          `🏢 Xona: ${dto.room_code ?? '-'}\n` +
          `🕒 Vaqt: ${eventTs.toISOString()}\n` +
          `📊 Ishonch: ${Math.round(confidence * 100)}%`;
        void this.notificationBot.sendNotificationRaw(securityChatId, msg).catch((e: unknown) => {
          this.logger.error('Security notification failed: %s', String(e));
        });
      }

      this.logger.warn(
        'Unknown face detected — camera=%s room=%s ts=%s',
        dto.camera_id ?? '-',
        dto.room_code ?? '-',
        eventTs.toISOString(),
      );

      const unknownLogResult = await this.repo.insertLog({
        employee_id:     null,
        event_type:      'detected',
        camera_id:       dto.camera_id,
        ts:              eventTs,
        face_confidence: confidence,
        room_code:       dto.room_code,
      });

      return Ok({
        log_id:      unknownLogResult.ok ? unknownLogResult.data.id : 'unresolved',
        employee_id: null,
        event_type:  dto.event_type,
        ts:          eventTs.toISOString(),
        is_late:     false,
      });
    }

    const today = this.time.formatDate(eventTs);
    await this.repo.upsertDailyAttendance(numericEmployeeId, today, dto.event_type, eventTs);

    const logResult = await this.repo.insertLog({
      employee_id:     numericEmployeeId,
      event_type:      dto.event_type,
      camera_id:       dto.camera_id,
      ts:              eventTs,
      face_confidence: confidence,
      room_code:       dto.room_code,
    });

    if (!logResult.ok) return Err(String(logResult.error));

    if (dto.event_type === 'exit') {
      this.emitter.emit('attendance.territory_exit', {
        employee_id: employeeIdStr,
        ts:          eventTs.toISOString(),
        room_code:   dto.room_code,
        log_id:      logResult.data.id,
      });
    }

    if (dto.event_type === 'enter') {
      this.emitter.emit('attendance.territory_enter', {
        employee_id:  employeeIdStr,
        ts:           eventTs.toISOString(),
        is_late:      isLate,
        minutes_late: this._minutesLate(eventTs),
        room_code:    dto.room_code,
        log_id:       logResult.data.id,
      });
    }

    return Ok({
      log_id:      logResult.data.id,
      employee_id: employeeIdStr,
      event_type:  dto.event_type,
      ts:          eventTs.toISOString(),
      is_late:     isLate,
    });
  }

  async getLiveStatus(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const today    = this.time.formatDate(this.time.today());
      const logsRes  = await this.repo.getLogsEnriched(today);
      const logs     = logsRes.ok ? (logsRes.data ?? []) : [];

      const latestEvent = new Map<number, { type: string; ts: Date }>();

      for (const log of logs) {
        if (log.employee_id === null) continue;
        const empId = log.employee_id;
        const logTs = new Date(log.ts);
        const existing = latestEvent.get(empId);
        if (!existing || logTs > existing.ts) {
          latestEvent.set(empId, { type: log.event_type, ts: logTs });
        }
      }

      const present = [...latestEvent.entries()]
        .filter(([, ev]) => ev.type === 'enter')
        .map(([id]) => id);
      const lateArrivals = [...latestEvent.entries()]
        .filter(([, ev]) => ev.type === 'enter' && this._isLateArrival('enter', ev.ts));

      return {
        date:          today,
        present_count: present.length,
        late_count:    lateArrivals.length,
        events_today:  logs.length,
        recent_events: logs.slice(0, 20).map((l) => ({
          id:              l.id,
          employee_id:     l.employee_id,
          employee_name:   l.employee_name,
          department_name: l.department_name,
          event_type:      l.event_type,
          room_code:       l.room_code,
          ts:              l.ts,
          confidence:      l.face_confidence,
        })),
      };
    });
  }

  async getLogsForDate(date: string, employeeId?: number): Promise<Result<object, AppError>> {
    const res = await this.repo.getLogsEnriched(date, employeeId);
    if (!res.ok) return Err(String(res.error));
    return Ok({ date, logs: res.data ?? [] });
  }

  private _tashkentMinutes(ts: Date): number {
    const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1_000;
    return Math.floor(((ts.getTime() + TASHKENT_OFFSET_MS) % (24 * 60 * 60 * 1_000)) / 60_000);
  }

  private _isLateArrival(eventType: string, ts: Date): boolean {
    if (eventType !== 'enter') return false;
    const minutesSinceStart = this._tashkentMinutes(ts) - WORK_START_HOUR * 60;
    return minutesSinceStart > LATE_GRACE_MINUTES;
  }

  private _minutesLate(ts: Date): number {
    return Math.max(0, this._tashkentMinutes(ts) - WORK_START_HOUR * 60);
  }
}
