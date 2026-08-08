/**
 * @module warehouse-exit-guard.service
 * @description FAZA Q — Ombor AI-kamera nazorati (noqonuniy olib chiqish / ruxsatsiz
 *   kirish aniqlash). Chiqish darvozasi kamerasidan olingan suratni HR yuz-tanish
 *   infratuzilmasi orqali (FaceRecognitionService — REUSE, Q-46) ombor xodimi bilan
 *   solishtiradi; ixtiyoriy ravishda WMS `wms_goods_issues` hujjatidagi rasmiy
 *   chiquvchi xodim bilan ham taqqoslaydi. Natija (avvalgi eskirgan/ulanmagan)
 *   `ai_camera_cross_check` jadvaliga yoziladi; nomuvofiqlik topilsa avtomatik
 *   xavfsizlik hodisasi (security_incidents, IncidentType.UNAUTHORIZED_WAREHOUSE_EXIT)
 *   yaratiladi — ReportIncidentCommand orqali (mavjud handler qayta ishlatiladi).
 * @layer Application (IoT)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AppErr, Err, Ok, Result } from '@common/result';
import { SYSTEM_USER_ID } from '@common/constants/app.constants';
import {
  WAREHOUSE_EXIT_FACE_MATCH_THRESHOLD,
  WAREHOUSE_EXIT_MATCH_SCORE_DECIMALS,
} from '@common/constants/business.constants';
import { FaceRecognitionService } from '@modules/hr/attendance/face-recognition.service';
import { ReportIncidentCommand } from '@modules/security/application/commands/report-incident.command';
import { IncidentSeverity, IncidentType } from '@modules/security/domain/enums/incident-severity.enum';
import { DrizzleCameraRepo } from '../infrastructure/repositories/drizzle-camera.repo';
import {
  IWarehouseExitGuardRepo,
  WAREHOUSE_EXIT_GUARD_REPO,
  CrossCheckRow,
} from '../domain/repositories/i-warehouse-exit-guard.repo';

export interface VerifyExitInput {
  cameraId: number;
  claimedEmployeeId: number;
  imageBase64: string;
  /** Optional link to the real WMS document — cross-checked against its recorded issuer. */
  goodsIssueId?: number;
}

export interface VerifyExitResult {
  crossCheckId: number;
  anomalyDetected: boolean;
  matchScore: number;
  expectedLocation: string | null;
  detectedLocation: string | null;
  incidentCreated: boolean;
}

function roundScore(v: number): number {
  const f = 10 ** WAREHOUSE_EXIT_MATCH_SCORE_DECIMALS;
  return Math.round(v * f) / f;
}

@Injectable()
export class WarehouseExitGuardService {
  private readonly logger = new Logger(WarehouseExitGuardService.name);

  constructor(
    private readonly faceRecognition: FaceRecognitionService,
    private readonly cameraRepo: DrizzleCameraRepo,
    private readonly commandBus: CommandBus,
    @Inject(WAREHOUSE_EXIT_GUARD_REPO) private readonly repo: IWarehouseExitGuardRepo,
  ) {}

  listCrossChecks(anomalyOnly: boolean, limit: number): Promise<Result<CrossCheckRow[]>> {
    return this.repo.listCrossChecks(anomalyOnly, Math.min(Math.max(limit, 1), 200));
  }

  async verifyExit(dto: VerifyExitInput): Promise<Result<VerifyExitResult>> {
    const camResult = await this.cameraRepo.findCameraById(dto.cameraId);
    if (!camResult.ok) return Err(camResult.error);
    const camera = camResult.data as {
      id: number; code: string | null; name: string | null; location: string | null;
    } | null;
    if (!camera) return Err(AppErr('NOT_FOUND', `Kamera #${dto.cameraId} topilmadi`));

    let goodsIssueWarehouseLabel: string | null = null;
    let documentMismatch = false;
    if (dto.goodsIssueId != null) {
      const giResult = await this.repo.getGoodsIssueForGuard(dto.goodsIssueId);
      if (!giResult.ok) return Err(giResult.error);
      const goodsIssue = giResult.data;
      if (!goodsIssue) return Err(AppErr('NOT_FOUND', `Chiqim hujjati #${dto.goodsIssueId} topilmadi`));
      goodsIssueWarehouseLabel = `${goodsIssue.warehouse_name ?? `ombor#${goodsIssue.warehouse_id}`} chiqish darvozasi`;
      documentMismatch = goodsIssue.issued_by != null && goodsIssue.issued_by !== dto.claimedEmployeeId;
      if (documentMismatch) {
        this.logger.warn(
          `FAZA Q: goods-issue #${goodsIssue.id} issued_by=${goodsIssue.issued_by} != claimed=${dto.claimedEmployeeId}`,
        );
      }
    }

    const recognized = await this.faceRecognition.recognize(dto.imageBase64);
    if (!recognized.ok) return Err(recognized.error);
    const faces = Array.isArray(recognized.data.faces) ? recognized.data.faces : [];

    let bestMatchForClaimed: number | null = null;
    let otherMatchedEmployeeId: string | null = null;
    for (const face of faces) {
      const matchR = await this.faceRecognition.matchFace(face.embedding);
      if (!matchR.ok || !matchR.data.employee_id) continue;
      if (matchR.data.employee_id === String(dto.claimedEmployeeId)) {
        if (bestMatchForClaimed == null || matchR.data.confidence > bestMatchForClaimed) {
          bestMatchForClaimed = matchR.data.confidence;
        }
      } else {
        otherMatchedEmployeeId = matchR.data.employee_id;
      }
    }

    const faceConfirmed = bestMatchForClaimed != null && bestMatchForClaimed >= WAREHOUSE_EXIT_FACE_MATCH_THRESHOLD;
    const anomalyDetected = !faceConfirmed || documentMismatch;
    const cameraLabel = camera.location ?? camera.name ?? `kamera#${camera.id}`;
    const expectedLocation = goodsIssueWarehouseLabel ?? cameraLabel;
    const detectedLocation = faceConfirmed
      ? cameraLabel
      : otherMatchedEmployeeId
        ? `boshqa xodim aniqlandi (employee#${otherMatchedEmployeeId})`
        : 'aniqlanmadi';
    const matchScore = bestMatchForClaimed != null ? roundScore(bestMatchForClaimed) : 0;

    const inserted = await this.repo.insertCrossCheck({
      employeeId: dto.claimedEmployeeId,
      shiftId: null,
      expectedLocation,
      detectedLocation,
      matchScore,
      anomalyDetected,
      cameraSource: camera.code ?? String(camera.id),
    });
    if (!inserted.ok) return Err(inserted.error);

    let incidentCreated = false;
    if (anomalyDetected) {
      const reasons: string[] = [];
      if (!faceConfirmed) reasons.push("yuz-tanish tasdiqlamadi (moslik chegarasidan past yoki topilmadi)");
      if (documentMismatch) reasons.push("WMS chiqim hujjatidagi rasmiy xodim bilan mos kelmadi");
      const description =
        `Xodim #${dto.claimedEmployeeId} "${expectedLocation}" nuqtasida tasdiqlanmadi: ${reasons.join('; ')}.` +
        (dto.goodsIssueId != null ? ` Chiqim hujjati #${dto.goodsIssueId}.` : '');
      await this.commandBus.execute(
        new ReportIncidentCommand(
          IncidentType.UNAUTHORIZED_WAREHOUSE_EXIT,
          IncidentSeverity.HIGH,
          `Ombor chiqishida shubhali holat — kamera ${camera.code ?? camera.id}`,
          description,
          SYSTEM_USER_ID,
        ),
      );
      incidentCreated = true;
      this.logger.warn(`FAZA Q: anomaliya aniqlandi, xavfsizlik hodisasi yaratildi — ${description}`);
    }

    return Ok({
      crossCheckId: inserted.data.id,
      anomalyDetected,
      matchScore,
      expectedLocation,
      detectedLocation,
      incidentCreated,
    });
  }
}
