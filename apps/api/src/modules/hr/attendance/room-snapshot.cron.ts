/**
 * RoomSnapshotCron — fires every 2 hours continuously.
 *
 * Phase 1: acquire new snapshots from camera_events (screenshot_url, last 2h).
 * Phase 2: analyse unprocessed attendance photos via Face AI.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { safeCall, Result, AppError } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { TerritoryLogRepository } from './territory-log.repository';
import { FaceRecognitionService } from './face-recognition.service';
import { db } from '@shared/db';
import { camera_events, hr_tz2_attendance_photos } from '@shared/db';
import { and, isNotNull, gte, ne, eq } from 'drizzle-orm';

const FATIGUE_THRESHOLD  = 0.7;
const ANOMALY_EMOTIONS   = new Set(['angry', 'fearful', 'disgusted']);
const TWO_HOURS_MS       = 2 * 60 * 60 * 1000;

interface FaceAnalysis {
  emotion: string;
  fatigue_score: number;
  posture_ok: boolean;
  anomaly: boolean;
  anomaly_reason?: string;
}

@Injectable()
export class RoomSnapshotCron {
  private readonly logger = new Logger(RoomSnapshotCron.name);
  private readonly time   = new TashkentTimeService();
  private _running        = false;

  constructor(
    private readonly repo:    TerritoryLogRepository,
    private readonly faceRec: FaceRecognitionService,
    private readonly emitter: EventEmitter2,
  ) {}

  @Cron('0 */2 * * *', { name: 'room-snapshot' })
  async runSnapshot(): Promise<void> {
    const acqResult = await this._acquireFromCameraEvents();
    if (!acqResult.ok) {
      this.logger.warn('RoomSnapshotCron acquire phase failed: %s', String(acqResult.error));
    }
    const result = await this.processUnprocessedPhotos();
    if (!result.ok) {
      this.logger.error('RoomSnapshotCron analyse phase failed: %s', String(result.error));
    }
  }

  /**
   * Phase 1: fetch new snapshots from camera_events and register them as
   * hr_tz2_attendance_photos rows for Phase 2 to analyse.
   */
  async _acquireFromCameraEvents(): Promise<Result<{ acquired: number }, AppError>> {
    return safeCall(async () => {
      const cutoff = new Date(this.time.now().getTime() - TWO_HOURS_MS);

      const events = await db
        .select({
          id:             camera_events.id,
          camera_id:      camera_events.camera_id,
          screenshot_url: camera_events.screenshot_url,
          created_at:     camera_events.created_at,
        })
        .from(camera_events)
        .where(
          and(
            isNotNull(camera_events.screenshot_url),
            gte(camera_events.created_at, cutoff),
            ne(camera_events.status, 'resolved'),
          ),
        );

      this.logger.log('RoomSnapshotCron acquire: %d camera events to process', events.length);
      let acquired = 0;

      for (const evt of events) {
        if (!evt.screenshot_url) continue;

        try {
          const recResult = await this.faceRec.recognizeFromUrl(
            evt.screenshot_url,
            evt.camera_id ?? undefined,
          );
          if (!recResult.ok) {
            this.logger.warn('Face AI unavailable for event #%s — skipping', evt.id);
            continue;
          }

          const faces = recResult.data.faces ?? [];

          for (const face of faces) {
            const embedding = face.embedding ?? [];
            if (embedding.length === 0) continue;

            const matchResult = await this.faceRec.matchFace(embedding);
            if (!matchResult.ok) continue;

            const employeeId = matchResult.data.employee_id
              ? parseInt(matchResult.data.employee_id, 10)
              : null;

            if (!employeeId || isNaN(employeeId)) continue;

            await db.insert(hr_tz2_attendance_photos).values({
              employee_id: employeeId,
              photo_url:   evt.screenshot_url,
              taken_at:    evt.created_at ?? this.time.now(),
              room_code:   evt.camera_id ?? null,
              processed:   false,
            });

            acquired++;
          }

          await db
            .update(camera_events)
            .set({ status: 'resolved' })
            .where(eq(camera_events.id, evt.id));
        } catch (err) {
          this.logger.error('Error acquiring snapshot from event #%s: %s', evt.id, String(err));
        }
      }

      this.logger.log('RoomSnapshotCron acquire: %d new photos registered', acquired);
      return { acquired };
    });
  }

  async processUnprocessedPhotos(): Promise<Result<{ processed: number }, AppError>> {
    return safeCall(async () => {
      if (this._running) {
        this.logger.warn('RoomSnapshotCron: previous run still in progress, skipping');
        return { processed: 0 };
      }

      this._running = true;
      let processed = 0;

      try {
        const photosRes = await this.repo.getUnprocessedPhotos();
        const photos    = photosRes.ok ? (photosRes.data ?? []) : [];

        this.logger.log('RoomSnapshotCron: %d unprocessed photos', photos.length);

        for (const photo of photos) {
          const analysis = await this._analysePhoto(photo.photo_url, photo.room_code ?? undefined);

          await this.repo.markPhotoProcessed(photo.id, {
            emotion:        analysis.emotion,
            fatigue_score:  analysis.fatigue_score,
            posture_score:  analysis.posture_ok ? 1.0 : 0.3,
            anomaly:        analysis.anomaly,
            anomaly_reason: analysis.anomaly_reason,
          });

          if (analysis.anomaly) {
            this.emitter.emit('hr.room_anomaly', {
              employee_id:   photo.employee_id,
              photo_id:      photo.id,
              room_code:     photo.room_code,
              emotion:       analysis.emotion,
              fatigue_score: analysis.fatigue_score,
              ts:            this.time.now().toISOString(),
              reason:        analysis.anomaly_reason,
            });
          }

          if (analysis.fatigue_score > FATIGUE_THRESHOLD) {
            this.emitter.emit('hr.fatigue_alert', {
              employee_id:   photo.employee_id,
              fatigue_score: analysis.fatigue_score,
              ts:            this.time.now().toISOString(),
            });
          }

          processed++;
        }
      } finally {
        this._running = false;
      }

      this.logger.log('RoomSnapshotCron: completed — processed=%d', processed);
      return { processed };
    });
  }

  private async _analysePhoto(photoUrl: string, roomCode?: string): Promise<FaceAnalysis> {
    const defaultResult: FaceAnalysis = {
      emotion: 'neutral',
      fatigue_score: 0,
      posture_ok: true,
      anomaly: false,
    };

    try {
      const recResult = await this.faceRec.recognizeFromUrl(photoUrl, roomCode);
      if (!recResult.ok) return defaultResult;

      const faces = recResult.data.faces ?? [];
      const face = faces[0];
      if (!face) return defaultResult;
      let anomaly        = false;
      let anomaly_reason: string | undefined;

      if (ANOMALY_EMOTIONS.has(face.emotion)) {
        anomaly = true;
        anomaly_reason = `Anomalous emotion detected: ${face.emotion}`;
      }
      if (face.fatigue_score > FATIGUE_THRESHOLD) {
        anomaly = true;
        anomaly_reason = ([anomaly_reason, `High fatigue: ${face.fatigue_score}`]).filter(Boolean).join('; ');
      }

      return {
        emotion:        face.emotion,
        fatigue_score:  face.fatigue_score,
        posture_ok:     face.posture_ok,
        anomaly,
        anomaly_reason,
      };
    } catch (err) {
      this.logger.error('_analysePhoto error: %s', String(err));
      return defaultResult;
    }
  }
}
