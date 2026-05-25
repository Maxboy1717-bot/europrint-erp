/** FaceRecognitionService — gateway to the hr-face-ai microservice.
 *  Matching: pgvector <=> primary; in-process cosine fallback.
 *  Enrollment: 0.7/0.3 weighted running-average, L2-normalised.
 */
import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';
import { safeCall, Result, AppError } from '@common/result';
import { IAttendanceRepository, ATTENDANCE_REPO } from './i-attendance.repo';

const FACE_AI_URL          = process.env['FACE_AI_SERVICE_URL'] ?? 'http://hr-face-ai:5001';
const TIMEOUT_MS           = 5_000;
const COSINE_SIM_THRESHOLD = 0.85;

export interface RecognizeResult {
  faces: Array<{
    embedding:           number[];
    bbox:                { x: number; y: number; w: number; h: number };
    emotion:             string;
    confidence:          number;
    matched_employee_id: string | null;
    posture_ok:          boolean;
    eye_contact:         boolean;
    fatigue_score:       number;
  }>;
  processing_time_ms: number;
  model_mode:         string;
}

export interface MatchResult {
  employee_id: string | null;
  confidence:  number;
  distance:    number;
}

@Injectable()
export class FaceRecognitionService {
  private readonly logger = new Logger(FaceRecognitionService.name);

  constructor(
    readonly http: HttpService,
    @Inject(ATTENDANCE_REPO) private readonly attendanceRepo: IAttendanceRepository,
  ) {}

  /** Returns Result.err when Face AI is UNAVAILABLE; empty faces[] is still ok. */
  async recognize(imageBase64: string, roomId?: string): Promise<Result<RecognizeResult, AppError>> {
    return safeCall(async () => {
      const res$ = this.http
        .post<RecognizeResult>(`${FACE_AI_URL}/recognize`, {
          image_base64: imageBase64,
          room_id:      roomId ?? null,
        })
        .pipe(
          timeout(TIMEOUT_MS),
          catchError((err) => {
            this.logger.warn('Face AI /recognize unavailable: %s', String(err?.message ?? err));
            return throwError(() => new Error(`face_ai_unavailable: ${String(err?.message ?? 'timeout')}`));
          }),
        );

      const resp = await firstValueFrom(res$) as { data: RecognizeResult };
      return resp.data;
    });
  }

  private _isAllowedImageHost(rawUrl: string): boolean {
    try {
      const { hostname } = new URL(rawUrl);
      const allowed = (process.env['CAMERA_SNAPSHOT_HOSTS'] ?? 'localhost,127.0.0.1')
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
      return (Array.isArray(allowed) ? allowed : []).some((h) => hostname === h || hostname.endsWith(`.${h}`));
    } catch { return false; }
  }

  async recognizeFromUrl(imageUrl: string, roomId?: string): Promise<Result<RecognizeResult, AppError>> {
    return safeCall(async () => {
      if (!this._isAllowedImageHost(imageUrl)) {
        throw new Error(`recognizeFromUrl: host not in CAMERA_SNAPSHOT_HOSTS allowlist — ${imageUrl}`);
      }
      const imgResp$ = this.http
        .get<Buffer>(imageUrl, { responseType: 'arraybuffer' })
        .pipe(
          timeout(TIMEOUT_MS),
          catchError((err) => {
            this.logger.warn('Image fetch failed %s: %s', imageUrl, String(err?.message ?? err));
            return throwError(() => new Error(`image_fetch_failed: ${String(err?.message ?? 'timeout')}`));
          }),
        );

      const imgResp = await firstValueFrom(imgResp$) as { data: Buffer };
      const base64  = Buffer.from(imgResp.data).toString('base64');
      const recResult = await this.recognize(base64, roomId);
      if (!recResult.ok) throw new Error(String(recResult.error));
      return recResult.data;
    });
  }

  /** pgvector <=> primary (threshold 0.85); in-process cosine fallback. */
  async matchFace(embedding: number[]): Promise<Result<MatchResult, AppError>> {
    return safeCall(async () => {
      const valid = this._validateEmbedding(embedding);
      if (!valid) return { employee_id: null, confidence: 0, distance: 1 };

      const pgResult = await this._matchViaPgvector(valid);
      if (pgResult !== null) return pgResult;

      return this._matchInProcess(valid);
    });
  }

  private async _matchViaPgvector(embedding: number[]): Promise<MatchResult | null> {
    const vectorLiteral = `[${embedding.join(',')}]`;
    const repoResult = await this.attendanceRepo.findEmployeeByEmbedding(
      vectorLiteral,
      COSINE_SIM_THRESHOLD,
    );
    if (!repoResult.ok) {
      this.logger.warn('pgvector match failed, falling back to in-process: %s', String(repoResult.error));
      return null;
    }
    const { id, distance: dist } = repoResult.data;
    if (!id) return { employee_id: null, confidence: 0, distance: 1 };
    const sim = Math.max(0, 1 - dist);
    return {
      employee_id: String(id),
      confidence:  Math.round(sim  * 10000) / 10000,
      distance:    Math.round(dist * 10000) / 10000,
    };
  }

  private async _matchInProcess(embedding: number[]): Promise<MatchResult> {
    const rows = await this.attendanceRepo.findAllWithEmbeddings();

    let bestId:  number | null = null;
    let bestSim  = -1;

    for (const row of rows) {
      if (!row.face_embedding) continue;
      const stored: number[] = row.face_embedding;
      if (!Array.isArray(stored) || stored.length === 0) continue;

      const sim = this._cosineSimilarity(embedding, stored);
      if (sim > bestSim) { bestSim = sim; bestId = row.id; }
    }

    const distance = Math.max(0, 1 - bestSim);

    if (bestId === null || bestSim < COSINE_SIM_THRESHOLD) {
      return { employee_id: null, confidence: 0, distance: 1 };
    }

    return {
      employee_id: String(bestId),
      confidence:  Math.round(bestSim * 10000) / 10000,
      distance:    Math.round(distance * 10000) / 10000,
    };
  }

  async registerEmbeddingFromImages(
    employeeId: string,
    images:     string[],
  ): Promise<Result<{ id: number }, AppError>> {
    return safeCall(async () => {
      const embeddings:  number[][] = [];
      let   maxConfidence           = 0;

      for (const [idx, imageBase64] of images.entries()) {
        const recResult = await this.recognize(imageBase64);
        if (!recResult.ok) {
          this.logger.warn(
            'Enrollment image #%d recognition failed for employee %s: %s',
            idx + 1,
            employeeId,
            String(recResult.error),
          );
          continue;
        }
        const faces = recResult.data.faces ?? [];
        const face = faces[0];
        if (!face) {
          this.logger.warn('Enrollment image #%d: no faces detected for employee %s', idx + 1, employeeId);
          continue;
        }
        embeddings.push(face.embedding);
        if (face.confidence > maxConfidence) maxConfidence = face.confidence;
      }

      if (embeddings.length === 0) {
        throw new Error('No faces detected in any of the provided images');
      }

      const dims = (embeddings[0] ?? []).length;
      const avg  = Array.from({ length: dims }, (_, i) =>
        (Array.isArray(embeddings) ? embeddings : []).reduce((sum, e) => sum + (e[i] ?? 0), 0) / embeddings.length,
      );
      const normalized = this._l2Normalize(avg);

      return this._saveEmbedding(employeeId, normalized, maxConfidence);
    });
  }

  async registerEmbedding(
    employeeId: string,
    embedding:  number[],
    confidence: number,
    imageUrl?:  string,
  ): Promise<Result<{ id: number }, AppError>> {
    return safeCall(async () => {
      let normalized = this._l2Normalize(embedding);

      try {
        const res$ = this.http
          .post<{ embedding: number[]; dims: number }>(
            `${FACE_AI_URL}/register-embedding`,
            { employee_id: employeeId, embedding, confidence },
          )
          .pipe(
            timeout(TIMEOUT_MS),
            catchError((err) => {
              this.logger.warn('Face AI /register-embedding unavailable — using raw embedding: %s', String(err?.message ?? err));
              return throwError(() => new Error('register_embedding_unavailable'));
            }),
          );

        const resp = await firstValueFrom(res$) as { data: { embedding: number[]; dims: number } };
        normalized = this._l2Normalize(resp.data.embedding ?? embedding);
      } catch {
        this.logger.warn('Face AI normalisation skipped — using raw embedding');
      }

      return this._saveEmbedding(employeeId, normalized, confidence, imageUrl);
    });
  }

  private async _saveEmbedding(
    employeeId:   string,
    newEmbedding: number[],
    confidence:   number,
    imageUrl?:    string,
  ): Promise<{ id: number }> {
    const numericId = parseInt(employeeId, 10);
    return this.attendanceRepo.saveEmployeeFaceEmbedding(numericId, newEmbedding, confidence, imageUrl);
  }

  async healthCheck(): Promise<Result<{ status: string; model_mode: string }, AppError>> {
    return safeCall(async () => {
      const res$ = this.http
        .post<{ status: string; model_mode: string }>(`${FACE_AI_URL}/health-check`, {})
        .pipe(
          timeout(TIMEOUT_MS),
          catchError((err) => {
            this.logger.warn('Face AI /health-check unavailable: %s', String(err?.message ?? err));
            return throwError(() => new Error('face_ai_health_check_unavailable'));
          }),
        );

      const resp = await firstValueFrom(res$) as { data: { status: string; model_mode: string } };
      return resp.data;
    });
  }

  /** Returns null if embedding is invalid (empty, NaN, or oversized). */
  private _validateEmbedding(embedding: number[]): number[] | null {
    if (!Array.isArray(embedding) || embedding.length === 0) return null;
    if (embedding.length < 16 || embedding.length > 2048) return null;
    for (const v of embedding) {
      if (typeof v !== 'number' || !isFinite(v)) return null;
    }
    return embedding;
  }

  private _cosineSimilarity(a: number[], b: number[]): number {
    let dot  = 0;
    let magA = 0;
    let magB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot  += (a[i] ?? 0) * (b[i] ?? 0);
      magA += (a[i] ?? 0) ** 2;
      magB += (b[i] ?? 0) ** 2;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom > 0 ? dot / denom : 0;
  }

  private _l2Normalize(v: number[]): number[] {
    const norm = Math.sqrt((Array.isArray(v) ? v : []).reduce((s, x) => s + x * x, 0));
    return norm > 0 ? (Array.isArray(v) ? v : []).map((x) => x / norm) : v;
  }
}
