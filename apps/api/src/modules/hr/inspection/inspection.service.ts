/**
 * @module inspection.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Rule 16: PDF generation + Object Storage helpers live in inspection-pdf.helpers.ts.
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { safeCall, Result, AppError } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { randomUUID } from 'crypto';
import { InspectionRepository } from './inspection.repository';
import { NotificationBotService } from '../telegram-bots/notification-bot.service';
import { db, hrEmployees } from '@shared/db';
import { eq, or } from 'drizzle-orm';
import type { ManualInspectionDto } from './dto/inspection.dto';
import {
  storeImage,
  generateChecklistPdf as generateChecklistPdfHelper,
} from './inspection-pdf.helpers';

type Row = Record<string, unknown>;

const ANOMALY_THRESHOLD = 0.6;
const ROOM_AI_URL_DEFAULT = 'http://hr-room-ai:5002';

interface AiComparisonResult {
  cleanliness_score: number;
  order_score:       number;
  equipment_ok:      boolean;
  issues:            string[];
  anomalies:         { type: string; description: string; severity: string }[];
}

@Injectable()
export class InspectionService {
  private readonly logger = new Logger(InspectionService.name);
  private readonly time   = new TashkentTimeService();

  private readonly roomAiUrl: string;

  constructor(
    private readonly repo:            InspectionRepository,
    private readonly http:            HttpService,
    private readonly notificationBot: NotificationBotService,
    private readonly configService:   ConfigService,
  ) {
    this.roomAiUrl = this.configService.get<string>('ROOM_AI_SERVICE_URL') ?? ROOM_AI_URL_DEFAULT;
  }

  async uploadReferencePhoto(
    roomCode:     string,
    imageBase64:  string,
    roomName:     string,
    uploadedBy?:  string,
    description?: string,
  ): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const photoUrl = await storeImage(roomCode, imageBase64, 'reference');
      const result   = await this.repo.upsertRoomReference({
        room_code:  roomCode,
        room_name:  roomName,
        photo_url:  photoUrl,
        description,
        updated_by: uploadedBy,
      });
      if (!result.ok) throw new Error(String(result.error));
      return result.data as Row;
    });
  }

  async getRooms(): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findAllRooms();
      if (!r.ok) throw new Error(String(r.error));
      return r.data as Row[];
    });
  }

  async getRoomHistory(
    roomCode: string,
    days:     number,
    limit     = 50,
    offset    = 0,
  ): Promise<Result<{ items: Row[]; total: number }, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findAnalysisHistory(roomCode, days, limit, offset);
      if (!r.ok) throw new Error(String(r.error));
      return r.data as { items: Row[]; total: number };
    });
  }

  async runRoomComparison(
    roomCode:        string,
    currentPhotoUrl: string,
  ): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const refResult   = await this.repo.findRoomByCode(roomCode);
      const ref         = refResult.ok ? (refResult.data as Row | null) : null;
      const refPhotoUrl = ref ? String(ref['photo_url'] ?? '') : null;

      if (!refPhotoUrl) {
        this.logger.debug('runRoomComparison: no reference photo for room=%s — skipped', roomCode);
        return { room_code: roomCode, status: 'no_reference', current_photo_url: currentPhotoUrl } as Row;
      }

      const scores = await this._callAiComparison(refPhotoUrl, currentPhotoUrl, roomCode);

      if (!scores) {
        this.logger.warn('runRoomComparison: AI unavailable for room=%s — skipped insertion', roomCode);
        return { room_code: roomCode, status: 'ai_unavailable', current_photo_url: currentPhotoUrl } as Row;
      }

      const insertResult = await this.repo.insertAnalysisResult({
        room_code:          roomCode,
        reference_photo_id: ref ? String(ref['id']) : null,
        current_photo_url:  currentPhotoUrl,
        analyzed_at:        this.time.now(),
        cleanliness_score:  scores.cleanliness_score,
        order_score:        scores.order_score,
        equipment_ok:       scores.equipment_ok,
        issues:             scores.issues,
        anomalies:          scores.anomalies,
        notified_hr:        false,
      });
      if (!insertResult.ok) throw new Error(String(insertResult.error));
      return insertResult.data as Row;
    });
  }

  async createManualInspection(dto: ManualInspectionDto, inspectorId?: string): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const cleanlinessScore = dto.cleanliness / 5;
      const orderScore       = dto.order_score / 5;
      const issues: string[] = [];
      const anomalies: { type: string; description: string; severity: string }[] = [];

      if (cleanlinessScore < ANOMALY_THRESHOLD) {
        issues.push('Tozalik past (qo\'lda inspeksiya)');
        anomalies.push({ type: 'cleanliness', description: 'Tozalik bali past', severity: 'medium' });
      }
      if (orderScore < ANOMALY_THRESHOLD) {
        issues.push('Tartib past (qo\'lda inspeksiya)');
        anomalies.push({ type: 'order', description: 'Tartib bali past', severity: 'medium' });
      }
      if (!dto.equipment_ok) {
        issues.push('Jihozlar joyida emas');
        anomalies.push({ type: 'equipment', description: 'Jihozlar muammosi', severity: 'high' });
      }
      if (dto.emergency_issues) {
        issues.push('Favqulodda holat qayd etildi');
        anomalies.push({ type: 'emergency', description: dto.notes ?? 'Favqulodda holat', severity: 'critical' });
      }

      const refResult  = await this.repo.findRoomByCode(dto.room_code);
      const ref        = refResult.ok ? (refResult.data as Row | null) : null;

      let currentPhotoUrl: string;
      if (dto.evidence_photo_url && (dto.evidence_photo_url.startsWith('data:') || dto.evidence_photo_url.startsWith('/9j') || dto.evidence_photo_url.length > 200)) {
        currentPhotoUrl = await storeImage(dto.room_code, dto.evidence_photo_url, `manual-${Date.now()}`);
      } else if (dto.evidence_photo_url) {
        currentPhotoUrl = dto.evidence_photo_url;
      } else {
        currentPhotoUrl = `/inspection/manual/${dto.room_code}/${randomUUID()}`;
      }

      const insertResult = await this.repo.insertAnalysisResult({
        room_code:          dto.room_code,
        reference_photo_id: ref ? String(ref['id']) : null,
        current_photo_url:  currentPhotoUrl,
        analyzed_at:        this.time.now(),
        cleanliness_score:  cleanlinessScore,
        order_score:        orderScore,
        equipment_ok:       dto.equipment_ok,
        issues,
        anomalies,
        notified_hr:        false,
        pdf_url:            null,
      });
      if (!insertResult.ok) throw new Error(String(insertResult.error));

      const record    = insertResult.data as Row;
      const analysisId = String(record['id']);

      const pdfResult = await this.generateChecklistPdf(analysisId, dto, inspectorId);
      if (pdfResult.ok && pdfResult.data) {
        await this.repo.updateAnalysisPdfUrl(analysisId, pdfResult.data).catch(() => undefined);
      }

      if (anomalies.length > 0) {
        const criticalFlag = (Array.isArray(anomalies) ? anomalies : []).some((a) => a.severity === 'critical') ? ' ⚠️ FAVQULODDA' : '';
        const msg = `🔍 Qo'lda inspeksiya${criticalFlag}\nXona: ${dto.room_code}\nMuammolar: ${issues.join(', ')}\nInspektor: ${inspectorId ?? 'Noma\'lum'}`;
        await this._notifyRoles(msg).catch((e) =>
          this.logger.warn('Manual inspection notify failed: %s', e instanceof Error ? e.message : String(e)),
        );
      }

      return {
        ...record,
        pdf_url:      pdfResult.ok ? pdfResult.data : null,
        inspector_id: inspectorId ?? null,
        notes:        dto.notes ?? null,
      };
    });
  }

  private async _notifyRoles(message: string): Promise<void> {
    const rows = await db
      .select({ telegram_chat_id: hrEmployees.telegram_chat_id })
      .from(hrEmployees)
      .where(
        or(
          eq(hrEmployees.role, 'HR_MANAGER'),
          eq(hrEmployees.role, 'HR_DIRECTOR'),
          eq(hrEmployees.role, 'SECURITY'),
        ),
      );
    const seen = new Set<string>();
    for (const row of (rows ?? [])) {
      const chatId = row.telegram_chat_id;
      if (!chatId || seen.has(chatId)) continue;
      seen.add(chatId);
      await this.notificationBot.sendNotificationRaw(chatId, message).catch(() => undefined);
    }
  }

  async submitChecklist(dto: ManualInspectionDto, inspectorId?: string): Promise<Result<Row, AppError>> {
    return this.createManualInspection(dto, inspectorId);
  }

  async getAlerts(hours = 48): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findRecentAlerts(hours);
      if (!r.ok) throw new Error(String(r.error));
      return r.data as Row[];
    });
  }

  async generateChecklistPdf(
    analysisId:  string,
    dto:         ManualInspectionDto,
    inspectorId?: string,
  ): Promise<Result<string, AppError>> {
    return generateChecklistPdfHelper(analysisId, dto, inspectorId);
  }

  private async _callAiComparison(
    referenceUrl:    string,
    currentPhotoUrl: string,
    roomCode:        string,
  ): Promise<AiComparisonResult | null> {
    try {
      const resp$ = this.http
        .post<AiComparisonResult>(
          `${this.roomAiUrl}/compare-rooms`,
          { reference_url: referenceUrl, current_url: currentPhotoUrl, room_code: roomCode },
          { timeout: 5_000 },
        )
        .pipe(
          timeout(5_000),
          catchError(() => of(null as null)),
        );
      const response = await firstValueFrom(resp$);
      if (response?.data) {
        this.logger.debug('AI comparison OK room=%s cs=%.2f os=%.2f',
          roomCode, response.data.cleanliness_score, response.data.order_score);
        return response.data;
      }
    } catch (e: unknown) {
      this.logger.warn('AI service unavailable room=%s: %s', roomCode, (e as Error)?.message);
    }

    this.logger.warn('_callAiComparison: no result from AI service room=%s — analysis skipped', roomCode);
    return null;
  }
}
