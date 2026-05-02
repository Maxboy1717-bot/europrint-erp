import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { hr_tz2_room_reference_photos, hr_tz2_ai_room_analysis } from '@shared/db';
import { eq, desc, gte, sql, and } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class InspectionRepository {
  private readonly logger = new Logger(InspectionRepository.name);

  async upsertRoomReference(dto: {
    room_code:       string;
    room_name:       string;
    department_code?: string;
    photo_url:       string;
    description?:    string;
    updated_by?:     string;
  }): Promise<Result<Row>> {
    try {
      const now = _time.now();
      const rows = await db
        .insert(hr_tz2_room_reference_photos)
        .values({
          room_code:       dto.room_code,
          room_name:       dto.room_name,
          department_code: dto.department_code ?? null,
          photo_url:       dto.photo_url,
          description:     dto.description ?? null,
          last_updated_at: now,
          updated_by:      dto.updated_by ?? null,
        })
        .onConflictDoUpdate({
          target: hr_tz2_room_reference_photos.room_code,
          set: {
            photo_url:       dto.photo_url,
            room_name:       dto.room_name,
            description:     dto.description ?? null,
            last_updated_at: now,
            updated_by:      dto.updated_by ?? null,
            updated_at:      now,
          },
        })
        .returning();
      return Ok((rows[0] ?? {}) as Row);
    } catch (e: unknown) {
      this.logger.warn('upsertRoomReference failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'upsertRoomReference failed');
    }
  }

  async findAllRooms(): Promise<Result<Row[]>> {
    try {
      const refs = await db
        .select()
        .from(hr_tz2_room_reference_photos)
        .orderBy(hr_tz2_room_reference_photos.room_code);

      const latest = await db
        .select({
          room_code:         hr_tz2_ai_room_analysis.room_code,
          analyzed_at:       hr_tz2_ai_room_analysis.analyzed_at,
          cleanliness_score: hr_tz2_ai_room_analysis.cleanliness_score,
          order_score:       hr_tz2_ai_room_analysis.order_score,
          equipment_ok:      hr_tz2_ai_room_analysis.equipment_ok,
          issues:            hr_tz2_ai_room_analysis.issues,
          anomalies:         hr_tz2_ai_room_analysis.anomalies,
          current_photo_url: hr_tz2_ai_room_analysis.current_photo_url,
          pdf_url:           hr_tz2_ai_room_analysis.pdf_url,
        })
        .from(hr_tz2_ai_room_analysis)
        .where(
          sql`${hr_tz2_ai_room_analysis.analyzed_at} = (
            SELECT MAX(a2.analyzed_at)
            FROM hr_tz2_ai_room_analysis a2
            WHERE a2.room_code = ${hr_tz2_ai_room_analysis.room_code}
          )`,
        )
        .limit(100);

      const latestByCode = new Map<string, Row>(
        ((latest as Row[]) ?? []).map((r) => [String(r['room_code']), r]),
      );

      const result = ((refs as Row[]) ?? []).map((ref) => {
        const la = latestByCode.get(String(ref['room_code'])) ?? null;
        return {
          ...ref,
          cleanliness_score: la ? la['cleanliness_score'] : null,
          order_score:       la ? la['order_score']       : null,
          equipment_ok:      la ? la['equipment_ok']      : null,
          issues:            la ? la['issues']            : null,
          anomalies:         la ? la['anomalies']         : null,
          current_photo_url: la ? la['current_photo_url'] : null,
          pdf_url:           la ? la['pdf_url']           : null,
          analyzed_at:       la ? la['analyzed_at']       : null,
        };
      });
      return Ok(result);
    } catch (e: unknown) {
      this.logger.warn('findAllRooms failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'findAllRooms failed');
    }
  }

  async findRoomByCode(code: string): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(hr_tz2_room_reference_photos)
        .where(eq(hr_tz2_room_reference_photos.room_code, code))
        .limit(1);
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e: unknown) {
      this.logger.warn('findRoomByCode failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'findRoomByCode failed');
    }
  }

  async insertAnalysisResult(dto: {
    room_code:          string;
    reference_photo_id: string | null;
    current_photo_url:  string;
    analyzed_at:        Date;
    cleanliness_score:  number;
    order_score:        number;
    equipment_ok:       boolean;
    issues:             string[];
    anomalies:          { type: string; description: string; severity: string }[];
    notified_hr:        boolean;
    pdf_url?:           string | null;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .insert(hr_tz2_ai_room_analysis)
        .values({
          room_code:          dto.room_code,
          reference_photo_id: dto.reference_photo_id,
          current_photo_url:  dto.current_photo_url,
          analyzed_at:        dto.analyzed_at,
          cleanliness_score:  String(dto.cleanliness_score),
          order_score:        String(dto.order_score),
          equipment_ok:       dto.equipment_ok,
          issues:             dto.issues,
          anomalies:          dto.anomalies,
          pdf_url:            dto.pdf_url ?? null,
          notified_hr:        dto.notified_hr,
        })
        .returning();
      return Ok((rows[0] ?? {}) as Row);
    } catch (e: unknown) {
      this.logger.warn('insertAnalysisResult failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'insertAnalysisResult failed');
    }
  }

  async findLatestAnalysis(roomCode: string): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(hr_tz2_ai_room_analysis)
        .where(eq(hr_tz2_ai_room_analysis.room_code, roomCode))
        .orderBy(desc(hr_tz2_ai_room_analysis.analyzed_at))
        .limit(1);
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e: unknown) {
      this.logger.warn('findLatestAnalysis failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'findLatestAnalysis failed');
    }
  }

  async findAnalysisHistory(
    roomCode: string,
    days:     number,
    limit     = 50,
    offset    = 0,
  ): Promise<Result<{ items: Row[]; total: number }>> {
    try {
      const since = new Date(_time.now().getTime() - days * 24 * 60 * 60 * 1000);
      const rows = await db
        .select()
        .from(hr_tz2_ai_room_analysis)
        .where(
          and(
            eq(hr_tz2_ai_room_analysis.room_code, roomCode),
            gte(hr_tz2_ai_room_analysis.analyzed_at, since),
          ),
        )
        .orderBy(desc(hr_tz2_ai_room_analysis.analyzed_at))
        .limit(limit)
        .offset(offset);
      const countRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(hr_tz2_ai_room_analysis)
        .where(
          and(
            eq(hr_tz2_ai_room_analysis.room_code, roomCode),
            gte(hr_tz2_ai_room_analysis.analyzed_at, since),
          ),
        );
      const total = Number(countRows[0]?.count ?? 0);
      return Ok({ items: rows as Row[], total });
    } catch (e: unknown) {
      this.logger.warn('findAnalysisHistory failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'findAnalysisHistory failed');
    }
  }

  async findRecentAlerts(hours: number): Promise<Result<Row[]>> {
    try {
      const since = new Date(_time.now().getTime() - hours * 60 * 60 * 1000);
      const rows = await db
        .select()
        .from(hr_tz2_ai_room_analysis)
        .where(gte(hr_tz2_ai_room_analysis.analyzed_at, since))
        .orderBy(desc(hr_tz2_ai_room_analysis.analyzed_at))
        .limit(200);

      const anomalies = (rows as Row[]).filter((r) => {
        const cs = parseFloat(String(r['cleanliness_score'] ?? '1'));
        const os = parseFloat(String(r['order_score'] ?? '1'));
        const eok = r['equipment_ok'];
        return cs < 0.6 || os < 0.6 || eok === false;
      });
      return Ok(anomalies);
    } catch (e: unknown) {
      this.logger.warn('findRecentAlerts failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'findRecentAlerts failed');
    }
  }

  async updateAnalysisPdfUrl(id: string, pdfUrl: string): Promise<Result<void>> {
    try {
      await db
        .update(hr_tz2_ai_room_analysis)
        .set({ pdf_url: pdfUrl, updated_at: _time.now() })
        .where(eq(hr_tz2_ai_room_analysis.id, id));
      return Ok(undefined);
    } catch (e: unknown) {
      this.logger.warn('updateAnalysisPdfUrl failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'updateAnalysisPdfUrl failed');
    }
  }

  async findAnalysisById(id: string): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(hr_tz2_ai_room_analysis)
        .where(eq(hr_tz2_ai_room_analysis.id, id))
        .limit(1);
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e: unknown) {
      this.logger.warn('findAnalysisById failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'findAnalysisById failed');
    }
  }

  async markNotifiedHr(id: string): Promise<Result<void>> {
    try {
      await db
        .update(hr_tz2_ai_room_analysis)
        .set({ notified_hr: true, updated_at: _time.now() })
        .where(eq(hr_tz2_ai_room_analysis.id, id));
      return Ok(undefined);
    } catch (e: unknown) {
      this.logger.warn('markNotifiedHr failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message ?? 'markNotifiedHr failed');
    }
  }
}
