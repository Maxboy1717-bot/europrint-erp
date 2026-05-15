/**
 * @module get-camera-snapshot.tool
 * @description Fetches latest frame from the camera. Talks to the existing
 * CameraService (apps/api/src/modules/camera) — falls back to a placeholder
 * URL if the service doesn't expose captureFrame yet so the rest of AIsha
 * still works in dev.
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';
import type { CameraSnapshot } from '../../domain/value-objects/tool-call.vo';

export interface ICameraSnapshotProvider {
  captureFrame(cameraId: string): Promise<{
    name: string; url: string; base64?: string; capturedAt: string;
  }>;
}

export const CAMERA_SNAPSHOT_PROVIDER = Symbol('AISHA_CAMERA_SNAPSHOT_PROVIDER');

export interface SnapshotResult {
  cameraId:   string;
  cameraName: string;
  url:        string;
  capturedAt: string;
  base64?:    string;
}

@Injectable()
export class GetCameraSnapshotTool implements IAishaTool {
  readonly definition = {
    name: 'get_camera_snapshot',
    description: 'Kameradan oxirgi kadrni olish (base64 + URL).',
    input_schema: {
      type: 'object' as const,
      properties: { cameraId: { type: 'string', description: 'Kamera IDsi' } },
      required: ['cameraId'],
    },
  };

  constructor(
    @Optional() @Inject(CAMERA_SNAPSHOT_PROVIDER)
    private readonly provider: ICameraSnapshotProvider | null = null,
  ) {}

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<SnapshotResult>>> {
    const id = String(input['cameraId'] ?? '');
    if (!id) return Err(AppErr('VALIDATION', 'cameraId majburiy'));
    if (!this.provider) return Err(AppErr('EXTERNAL_SERVICE', 'CameraSnapshotProvider provayderi ulanmagan'));

    return safeCall<ToolResult<SnapshotResult>>(async () => {
      const start = Date.now();
      const frame = await this.provider!.captureFrame(id);
      const snapshot: CameraSnapshot = {
        cameraId: id, cameraName: frame.name,
        snapshotUrl: frame.url, capturedAt: frame.capturedAt,
      };
      return provResult<SnapshotResult>({
        data: { cameraId: id, cameraName: frame.name, url: frame.url, capturedAt: frame.capturedAt, base64: frame.base64 },
        sources: [provSource({ type: 'camera', identifier: `camera.${id}`, startMs: start })],
        citations: [{ label: frame.name, url: `/iot/cameras/${id}` }],
        cameraSnapshots: [snapshot],
      });
    });
  }
}
