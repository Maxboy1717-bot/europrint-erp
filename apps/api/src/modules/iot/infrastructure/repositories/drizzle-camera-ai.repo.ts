/**
 * @module drizzle-camera-ai.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';
import {
  db, cameras, camera_events, camera_safety_violations,
  camera_quality_defects, camera_ai_configs, camera_alerts,
} from '@shared/db';
import { Ok, Err, Result } from '@common/result';

import { MS_PER_DAY } from '@common/constants/app.constants';
export interface CameraAiSummary {
  active_cameras: number;
  open_violations: number;
  open_defects: number;
  open_events: number;
}

export interface SafetyTrendRow {
  day: string;
  violations: number;
  high_severity: number;
}

export interface QualityAnalysisRow {
  defect_type: string | null;
  total: number;
  open_count: number;
  high_severity_count: number;
}

export interface ProductivityScoreRow {
  camera_name: string | null;
  location: string | null;
  total_events: number;
  violations: number;
  productivity_score: number;
}

export interface MachineUtilizationRow {
  camera_id: string | null;
  camera_name: string | null;
  event_count: number;
  idle_events: number;
  active_events: number;
}

export interface AnomalyEventRow {
  id: number;
  camera_id: string | null;
  event_type: string | null;
  description: string | null;
  severity: string | null;
  status: string | null;
  created_at: Date | null;
  camera_name: string | null;
  location: string | null;
}

export interface ActiveCameraRow {
  id: number;
  name: string | null;
  location: string | null;
  is_active: boolean;
  rtsp_url: string | null;
}

export interface CameraConfigData {
  cameraId: string;
  cameraName: string | null;
  cameraCode: string | null;
  triggerRules: Record<string, unknown>[];
  aiPrompt: string | null;
  zone: string | null;
  alertThreshold: string | number;
  isActive: boolean;
}

@Injectable()
export class DrizzleCameraAiRepo {
  async findSummary(): Promise<Result<CameraAiSummary>> {
    try {
      const [camCounts] = await db.select({
        active_cameras: sql<number>`COUNT(*) FILTER (WHERE ${cameras.is_active} = true)`,
      }).from(cameras);
      const [violCounts] = await db.select({
        open_violations: sql<number>`COUNT(*) FILTER (WHERE ${camera_safety_violations.status} = 'open')`,
      }).from(camera_safety_violations);
      const [defCounts] = await db.select({
        open_defects: sql<number>`COUNT(*) FILTER (WHERE ${camera_quality_defects.status} = 'open')`,
      }).from(camera_quality_defects);
      const [evCounts] = await db.select({
        open_events: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.status} = 'new')`,
      }).from(camera_events);
      return Ok({ ...camCounts, ...violCounts, ...defCounts, ...evCounts });
    } catch (e) { return Err((e as Error).message); }
  }

  async findSafetyTrends(days: number): Promise<Result<SafetyTrendRow[]>> {
    try {
      const since = new Date(Date.now() - days * MS_PER_DAY);
      const rows = await db.select({
        day: sql<string>`DATE_TRUNC('day', ${camera_safety_violations.detected_at})`,
        violations: count(camera_safety_violations.id),
        high_severity: sql<number>`COUNT(*) FILTER (WHERE ${camera_safety_violations.severity} = 'high')`,
      })
        .from(camera_safety_violations)
        .where(gte(camera_safety_violations.detected_at, since))
        .groupBy(sql`DATE_TRUNC('day', ${camera_safety_violations.detected_at})`)
        .orderBy(sql`day ASC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findQualityAnalysis(): Promise<Result<QualityAnalysisRow[]>> {
    try {
      const rows = await db.select({
        defect_type: camera_quality_defects.defect_type,
        total: count(camera_quality_defects.id),
        open_count: sql<number>`COUNT(*) FILTER (WHERE ${camera_quality_defects.status} = 'open')`,
        high_severity_count: sql<number>`COUNT(*) FILTER (WHERE ${camera_quality_defects.severity} = 'high')`,
      })
        .from(camera_quality_defects)
        .groupBy(camera_quality_defects.defect_type)
        .orderBy(sql`total DESC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findProductivityScores(): Promise<Result<ProductivityScoreRow[]>> {
    try {
      const since = new Date(Date.now() - 30 * MS_PER_DAY);
      const rows = await db.select({
        camera_name: cameras.name,
        location: cameras.location,
        total_events: sql<number>`COUNT(DISTINCT ${camera_events.id})`,
        violations: sql<number>`COUNT(DISTINCT ${camera_safety_violations.id})`,
        productivity_score: sql<number>`ROUND(100.0 - (COUNT(DISTINCT ${camera_safety_violations.id})::float / GREATEST(COUNT(DISTINCT ${camera_events.id}), 1) * 100), 1)`,
      })
        .from(cameras)
        .leftJoin(
          camera_events,
          and(eq(cameras.id, camera_events.camera_id), gte(camera_events.created_at, since)),
        )
        .leftJoin(
          camera_safety_violations,
          and(sql`${cameras.id}::text = ${camera_safety_violations.camera_id}`, gte(camera_safety_violations.detected_at, since)),
        )
        .where(eq(cameras.is_active, true))
        .groupBy(cameras.id, cameras.name, cameras.location)
        .orderBy(sql`productivity_score DESC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findMachineUtilization(): Promise<Result<MachineUtilizationRow[]>> {
    try {
      const since = new Date(Date.now() - 7 * MS_PER_DAY);
      const rows = await db.select({
        camera_id: camera_events.camera_id,
        camera_name: cameras.name,
        event_count: count(camera_events.id),
        idle_events: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'idle')`,
        active_events: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'active')`,
      })
        .from(camera_events)
        .leftJoin(cameras, eq(cameras.id, camera_events.camera_id))
        .where(gte(camera_events.created_at, since))
        .groupBy(camera_events.camera_id, cameras.name)
        .orderBy(sql`event_count DESC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findAnomalyDetection(): Promise<Result<AnomalyEventRow[]>> {
    try {
      const rows = await db.select({
        id: camera_events.id,
        camera_id: camera_events.camera_id,
        event_type: camera_events.event_type,
        description: camera_events.description,
        severity: camera_events.severity,
        status: camera_events.status,
        created_at: camera_events.created_at,
        camera_name: cameras.name,
        location: cameras.location,
      })
        .from(camera_events)
        .leftJoin(cameras, eq(cameras.id, camera_events.camera_id))
        .where(
          sql`${camera_events.severity} = 'high' OR ${camera_events.event_type} = 'anomaly'`,
        )
        .orderBy(desc(camera_events.created_at))
        .limit(50);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async listActiveCameras(): Promise<Result<ActiveCameraRow[]>> {
    try {
      const rows = await db.select({
        id: cameras.id,
        name: cameras.name,
        location: cameras.location,
        is_active: cameras.is_active,
        rtsp_url: cameras.rtsp_url,
      })
        .from(cameras)
        .where(eq(cameras.is_active, true))
        .orderBy(cameras.name);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findCameraConfig(id: string): Promise<Result<CameraConfigData>> {
    try {
      const [cam] = await db.select({
        id: cameras.id,
        name: cameras.name,
        code: cameras.code,
      }).from(cameras).where(eq(cameras.id, parseInt(id, 10)));
      if (!cam) return Err('Kamera topilmadi');
      const [config] = await db.select()
        .from(camera_ai_configs)
        .where(eq(camera_ai_configs.camera_id, id));
      // Audit 2026-08-07: `detection_types` is a live `jsonb` column, but the Drizzle schema
      // (schema-misc-iot.ts) declares it `text()` — a schema/DB type drift. The pg driver
      // parses jsonb to a native JS value regardless of what Drizzle thinks the TS type is
      // (verified live: `SELECT detection_types` returns a real array, not a JSON string), so
      // the old `typeof raw === 'string'` check was ALWAYS false whenever a row actually had
      // data — every configured camera silently fell back to the full default mission catalog
      // (Q-40: looked like "no config yet" when a config existed).
      //
      // Two shapes exist in the wild (both written by working code — `updateCameraTriggerRulesFromBody`
      // writes a plain array, `updateCameraPrompt`/`patchCameraAi` write `{ai_prompt, rules}`
      // because `camera_ai_configs.ai_prompt` has no dedicated Drizzle column to write to
      // directly). Both are parsed here so neither write path silently loses the other's data.
      const raw: unknown = config?.detection_types;
      const parsed: unknown = typeof raw === 'string' ? this._safeJsonParse(raw) : raw;
      let triggerRules: Record<string, unknown>[] = [];
      let aiPrompt: string | null = null;
      if (Array.isArray(parsed)) {
        triggerRules = parsed as Record<string, unknown>[];
      } else if (parsed && typeof parsed === 'object') {
        const obj = parsed as { rules?: unknown; ai_prompt?: unknown };
        triggerRules = Array.isArray(obj.rules) ? (obj.rules as Record<string, unknown>[]) : [];
        aiPrompt = typeof obj.ai_prompt === 'string' ? obj.ai_prompt : null;
      }
      return Ok({
        cameraId: id,
        cameraName: cam.name,
        cameraCode: cam.code,
        triggerRules,
        aiPrompt,
        zone: config?.zone ?? null,
        alertThreshold: config?.alert_threshold ?? 0.8,
        isActive: config?.is_active ?? true,
      });
    } catch (e) { return Err((e as Error).message); }
  }

  async upsertCameraConfig(
    id: string,
    cameraName: string,
    detectionTypes: string,
    zone: string,
    alertThreshold: number,
    isActive: boolean,
  ): Promise<Result<boolean>> {
    try {
      await db.insert(camera_ai_configs)
        .values({
          camera_id: id,
          camera_name: cameraName,
          detection_types: detectionTypes,
          zone,
          alert_threshold: String(alertThreshold),
          is_active: isActive,
        })
        .onConflictDoUpdate({
          target: camera_ai_configs.camera_id,
          set: {
            detection_types: detectionTypes,
            zone,
            alert_threshold: String(alertThreshold),
            is_active: isActive,
            updated_at: _time.now(),
          },
        });
      return Ok(true);
    } catch (e) { return Err((e as Error).message); }
  }

  /**
   * 2.11 — persist one real VLM finding from analyze-by-missions as a
   * `camera_events` row (Q-35: no new table, existing camera_events fits:
   * event_type/description/severity/ai_confidence). Called only when the
   * caller opted in via `persist: true` (CameraAnalysisWorkbench.tsx "Bazaga
   * yozish" switch).
   */
  async createCameraEvent(input: {
    cameraId: string;
    eventType: string;
    description: string;
    severity: string;
    aiConfidence: number | null;
  }): Promise<Result<{ id: number }>> {
    try {
      const now = _time.now().toISOString();
      const [row] = await db.insert(camera_events)
        .values({
          camera_id: input.cameraId,
          event_type: input.eventType,
          // Live DB: event_date/event_time NOT NULL, no default (drift — see
          // schema-misc-iot.ts comment above camera_events); derived from `now`.
          event_date: now.slice(0, 10),
          event_time: now.slice(11, 19),
          description: input.description,
          severity: input.severity,
          status: 'new',
          ai_confidence: input.aiConfidence !== null ? String(input.aiConfidence) : null,
        })
        .returning({ id: camera_events.id });
      return Ok({ id: row.id });
    } catch (e) { return Err((e as Error).message); }
  }

  /**
   * Item #85: AI-detected findings (createCameraEvent) never produced a
   * camera_alerts row, so the already-built human-confirm (acknowledge/resolve)
   * UI+API (CameraAlertsRouteController) was permanently empty — a disconnected
   * half-loop. Links back to the source camera_events row via camera_event_id.
   */
  async createCameraAlert(input: {
    cameraId: string;
    cameraEventId: number;
    alertType: string;
    severity: string;
    title: string;
    message: string;
  }): Promise<Result<{ id: number }>> {
    try {
      const [row] = await db.insert(camera_alerts)
        .values({
          camera_id: input.cameraId,
          camera_event_id: String(input.cameraEventId),
          alert_type: input.alertType,
          severity: input.severity,
          title: input.title,
          message: input.message,
        })
        .returning({ id: camera_alerts.id });
      return Ok({ id: row.id });
    } catch (e) { return Err((e as Error).message); }
  }

  private _safeJsonParse(raw: string): unknown {
    try { return JSON.parse(raw); } catch { return null; }
  }
}
