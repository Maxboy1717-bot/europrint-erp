import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { safeCall, Result, AppError } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { objectStorageClient } from '../../../lib/objectStorage';
import { randomUUID } from 'crypto';
import { InspectionRepository } from './inspection.repository';
import { NotificationBotService } from '../telegram-bots/notification-bot.service';
import { db, hrEmployees } from '@shared/db';
import { eq, or } from 'drizzle-orm';
import type { ManualInspectionDto } from './dto/inspection.dto';


type Row = Record<string, unknown>;

const ANOMALY_THRESHOLD = 0.6;
const ROOM_AI_URL = process.env['ROOM_AI_SERVICE_URL'] ?? 'http://hr-room-ai:5002';

interface AiComparisonResult {
  cleanliness_score: number;
  order_score:       number;
  equipment_ok:      boolean;
  issues:            string[];
  anomalies:         { type: string; description: string; severity: string }[];
}

/** Parse `/bucket/object/path` or `gs://bucket/path` into { bucketName, objectName } */
function parseBucketPath(fullPath: string): { bucketName: string; objectName: string } {
  let normalized = fullPath.startsWith('gs://') ? fullPath.replace(/^gs:\/\//, '/') : fullPath;
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  const parts      = normalized.split('/');
  const bucketName = parts[1] ?? '';
  const objectPath = parts.slice(2).join('/');
  if (!bucketName) throw new Error(`Noto'g'ri Object Storage path: "${fullPath}"`);
  return { bucketName, objectName: objectPath };
}

@Injectable()
export class InspectionService {
  private readonly logger = new Logger(InspectionService.name);
  private readonly time   = new TashkentTimeService();

  constructor(
    private readonly repo:            InspectionRepository,
    private readonly http:            HttpService,
    private readonly notificationBot: NotificationBotService,
  ) {}

  async uploadReferencePhoto(
    roomCode:     string,
    imageBase64:  string,
    roomName:     string,
    uploadedBy?:  string,
    description?: string,
  ): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const photoUrl = await this._storeImage(roomCode, imageBase64, 'reference');
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
        currentPhotoUrl = await this._storeImage(dto.room_code, dto.evidence_photo_url, `manual-${Date.now()}`);
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
        const criticalFlag = (anomalies ?? []).some((a) => a.severity === 'critical') ? ' ⚠️ FAVQULODDA' : '';
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
    return safeCall(async () => {
      const pdfDoc   = await PDFDocument.create();
      const page     = pdfDoc.addPage([595, 842]);
      const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();
      let y = height - 60;

      page.drawText('XONA INSPEKSIYASI CHECKLIST', {
        x: 40, y, size: 18, font: boldFont, color: rgb(0.12, 0.28, 0.60),
      });
      y -= 30;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
      y -= 20;

      const addRow = (label: string, value: string) => {
        page.drawText(`${label}:`, { x: 40, y, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(value, { x: 180, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
        y -= 18;
      };

      addRow('Xona kodi',       dto.room_code);
      addRow('Inspeksiya vaqti', this.time.now().toLocaleString('uz'));
      addRow('Inspektor ID',    inspectorId ?? 'Noaniq');
      addRow('Tahlil ID',       analysisId);

      y -= 10;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
      y -= 18;

      const stars = (n: number) => (Array(5).fill(0) ?? []).map((_, i) => i < n ? '★' : '☆').join('');
      addRow('Tozalik',     `${stars(dto.cleanliness)}  (${dto.cleanliness}/5)`);
      addRow('Tartib',      `${stars(dto.order_score)}  (${dto.order_score}/5)`);
      addRow('Jihozlar',    dto.equipment_ok ? 'OK — Joyida' : 'MUAMMO — Tekshirilsin');
      addRow('Favqulodda',  dto.emergency_issues ? 'HA — Zudlik bilan!' : 'Yo\'q');

      if (dto.notes) {
        y -= 5;
        page.drawText('Izohlar:', { x: 40, y, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
        y -= 15;
        page.drawText(String(dto.notes ?? '').slice(0, 120), { x: 40, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 15;
      }

      y -= 20;
      const overallScore = ((dto.cleanliness + dto.order_score) / 10) * 100;
      const scoreColor   = overallScore >= 80 ? rgb(0.1, 0.5, 0.1)
                         : overallScore >= 60 ? rgb(0.8, 0.5, 0)
                         : rgb(0.7, 0.1, 0.1);
      page.drawText(`UMUMIY BAL: ${Math.round(overallScore)}%`, {
        x: 40, y, size: 14, font: boldFont, color: scoreColor,
      });
      page.drawText('EuroPrint ERP — Inspeksiya Moduli  v2.0', {
        x: 40, y: 30, size: 8, font, color: rgb(0.6, 0.6, 0.6),
      });

      const pdfBytes = await pdfDoc.save();
      const pdfUrl   = await this._storePdfBuffer(Buffer.from(pdfBytes), analysisId);
      return pdfUrl;
    });
  }

  private async _callAiComparison(
    referenceUrl:    string,
    currentPhotoUrl: string,
    roomCode:        string,
  ): Promise<AiComparisonResult | null> {
    try {
      const resp$ = this.http
        .post<AiComparisonResult>(
          `${ROOM_AI_URL}/compare-rooms`,
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

  private async _storeImage(roomCode: string, imageBase64: string, suffix: string): Promise<string> {
    const privateDir = process.env['PRIVATE_OBJECT_DIR'] ?? '';
    if (!privateDir) throw new Error('PRIVATE_OBJECT_DIR sozlanmagan — Object Storage kerak');

    const { bucketName, objectName: objPrefix } = parseBucketPath(privateDir);
    const objectName  = `${objPrefix}/inspection/rooms/${roomCode}/${suffix}-${randomUUID()}.jpg`;
    const base64Data  = imageBase64.includes(',') ? imageBase64.split(',')[1]! : imageBase64;
    const buffer      = Buffer.from(base64Data, 'base64');

    await objectStorageClient.bucket(bucketName).file(objectName).save(buffer, {
      metadata: { contentType: 'image/jpeg' },
    });
    return `https://storage.googleapis.com/${bucketName}/${objectName}`;
  }

  private async _storePdfBuffer(buffer: Buffer, analysisId: string): Promise<string> {
    const privateDir = process.env['PRIVATE_OBJECT_DIR'] ?? '';
    if (!privateDir) throw new Error('PRIVATE_OBJECT_DIR sozlanmagan — Object Storage kerak');

    const { bucketName, objectName: objPrefix } = parseBucketPath(privateDir);
    const objectName = `${objPrefix}/inspection/checklists/${analysisId}.pdf`;

    await objectStorageClient.bucket(bucketName).file(objectName).save(buffer, {
      metadata: { contentType: 'application/pdf' },
    });
    return `https://storage.googleapis.com/${bucketName}/${objectName}`;
  }
}
