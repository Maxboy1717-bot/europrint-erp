/**
 * @module camera-snapshot.provider
 * @description Real implementation of `ICameraSnapshotProvider` (the port
 * consumed by 5 AIsha camera tools: get-camera-snapshot, analyze-camera-feed,
 * detect-workers-in-area, detect-safety-violations, get-machine-state-via-vision).
 *
 * Reads the camera's connection info from the `cameras` table (schema-misc-iot.ts:
 * ip_address, port, rtsp_url, stream_url) and fetches one JPEG frame over
 * plain HTTP — the standard "snapshot" endpoint exposed by virtually every
 * ONVIF/IP camera (e.g. `http://<ip>:<port>/snapshot.jpg`,
 * `/cgi-bin/snapshot.cgi`, or a vendor-configured `stream_url` that already
 * points at a JPEG snapshot/MJPEG-boundary endpoint). NOTE: the live DB has
 * an additional `thumbnail_url` column not yet declared in the Drizzle
 * `cameras` schema (schema-misc-iot.ts) — out of scope for this task
 * (2.12 = provider binding, not schema drift repair); `stream_url` already
 * covers the "explicit HTTP URL configured" case.
 *
 * RTSP (`rtsp_url`) is NOT decoded here: doing so requires a video-decode
 * dependency (ffmpeg/gstreamer bindings) that is not present in this project's
 * package.json (see @module note below) and no live camera exists in the
 * `cameras` table to validate against (0 rows in `europrint` DB as of
 * 2026-07-03 — see docs/audit/MASTER-REJA-VIZYON-2026-07-02.md item 2.12).
 * When only an `rtsp_url` is configured for a camera, `captureFrame` returns
 * a clear EXTERNAL_SERVICE-shaped error via a thrown Error (caller tools wrap
 * this in Result) instead of fabricating a frame.
 *
 * BLOCKED (infrastructure, not fabricatable — Q-46/EGASI-DATA class limit):
 *   - No physical camera is registered (`SELECT count(*) FROM cameras` = 0).
 *   - RTSP frame decode needs an external binary/lib (ffmpeg) — not installed,
 *     not in package.json. Adding it is an infra/dependency decision, not a
 *     wiring fix; left for owner to approve alongside real camera onboarding.
 *   - HTTP-snapshot path below IS real and will work the moment a camera row
 *     with a working snapshot/stream URL is inserted — it is not a stub.
 */

import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, cameras } from '@shared/db';
import type { ICameraSnapshotProvider } from '../../application/tools/get-camera-snapshot.tool';

const SNAPSHOT_FETCH_TIMEOUT_MS = 8000;

@Injectable()
export class CameraSnapshotProvider implements ICameraSnapshotProvider {
  private readonly logger = new Logger(CameraSnapshotProvider.name);

  async captureFrame(cameraId: string): Promise<{
    name: string; url: string; base64?: string; capturedAt: string;
  }> {
    const numericId = Number(cameraId);
    const rows = Number.isFinite(numericId) && Number.isInteger(numericId)
      ? await db.select({
          id: cameras.id,
          name: cameras.name,
          ip_address: cameras.ip_address,
          port: cameras.port,
          rtsp_url: cameras.rtsp_url,
          stream_url: cameras.stream_url,
          is_active: cameras.is_active,
        }).from(cameras).where(eq(cameras.id, numericId)).limit(1)
      : [];

    const camera = rows[0];
    if (!camera) {
      throw new Error(`Kamera topilmadi: ${cameraId}`);
    }
    if (camera.is_active === false) {
      throw new Error(`Kamera faol emas: ${camera.name ?? cameraId}`);
    }

    const snapshotUrl = this.resolveHttpSnapshotUrl(camera);
    if (!snapshotUrl) {
      throw new Error(
        `Kamera "${camera.name ?? cameraId}" uchun HTTP snapshot manzili yo'q ` +
        `(faqat rtsp_url bor bo'lishi mumkin — RTSP kadr-olish infratuzilmasi ulanmagan).`,
      );
    }

    const capturedAt = new Date().toISOString();
    const base64 = await this.fetchJpegAsBase64(snapshotUrl);

    return {
      name: camera.name ?? `Kamera ${cameraId}`,
      url: snapshotUrl,
      base64,
      capturedAt,
    };
  }

  /**
   * Prefers an explicit HTTP(S) stream/thumbnail URL already stored on the
   * camera row. Falls back to the conventional ONVIF/IP-camera snapshot path
   * derived from ip_address + port when only those are configured. Never
   * touches rtsp:// URLs (not decodable without ffmpeg — see module note).
   */
  private resolveHttpSnapshotUrl(camera: {
    stream_url: string | null;
    ip_address: string | null;
    port: number | null;
  }): string | null {
    if (camera.stream_url && /^https?:\/\//i.test(camera.stream_url)) {
      return camera.stream_url;
    }
    if (camera.ip_address) {
      const port = camera.port ?? 80;
      return `http://${camera.ip_address}:${port}/snapshot.jpg`;
    }
    return null;
  }

  private async fetchJpegAsBase64(url: string): Promise<string | undefined> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SNAPSHOT_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Kamera snapshot so'rovi muvaffaqiyatsiz: HTTP ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    } catch (e) {
      // Network/infra failure (camera offline, wrong URL, timeout) — logged,
      // frame returned without base64 so callers still get name/url/capturedAt
      // instead of hard-crashing the tool.
      this.logger.warn(`Kamera snapshot olinmadi (${url}): ${e instanceof Error ? e.message : String(e)}`);
      return undefined;
    } finally {
      clearTimeout(timeout);
    }
  }
}
