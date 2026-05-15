/**
 * @module analyze-camera-feed.tool
 * @description Captures a frame from the named camera and asks Claude vision
 * a free-form question. The provenance trail records both the camera frame
 * timestamp AND the LLM model so the Director knows exactly what was seen
 * by what.
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';
import type { CameraSnapshot } from '../../domain/value-objects/tool-call.vo';
import {
  GetCameraSnapshotTool,
  CAMERA_SNAPSHOT_PROVIDER,
  type ICameraSnapshotProvider,
} from './get-camera-snapshot.tool';
import { ClaudeService } from '../llm/claude.service';

export interface VisionAnalysis {
  description: string;
  cameraId:    string;
  cameraName:  string;
}

@Injectable()
export class AnalyzeCameraFeedTool implements IAishaTool {
  readonly definition = {
    name: 'analyze_camera_feed',
    description: 'Kameraning jonli oqimini AI vision orqali tahlil qilish.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cameraId: { type: 'string', description: 'Kamera IDsi' },
        question: { type: 'string', description: 'Tahlil savoli (masalan: necha nafar ishchi ko\'rinmoqda)' },
      },
      required: ['cameraId', 'question'],
    },
  };

  constructor(
    private readonly claude: ClaudeService,
    @Optional() @Inject(CAMERA_SNAPSHOT_PROVIDER)
    private readonly provider: ICameraSnapshotProvider | null = null,
  ) {}

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<VisionAnalysis>>> {
    const cameraId = String(input['cameraId'] ?? '');
    const question = String(input['question'] ?? '');
    if (!cameraId || !question) return Err(AppErr('VALIDATION', 'cameraId va question majburiy'));
    if (!this.provider) return Err(AppErr('EXTERNAL_SERVICE', 'CameraSnapshotProvider ulanmagan'));

    return safeCall<ToolResult<VisionAnalysis>>(async () => {
      const start = Date.now();
      const frame = await this.provider!.captureFrame(cameraId);
      if (!frame.base64) throw new Error('Kamera kadri base64 formatida qaytarmadi');

      const messages = [{
        role: 'user' as const,
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame.base64 } },
          { type: 'text', text: question },
        ],
      }];
      const r = await this.claude.sendOneShot({ messages, maxTokens: 512 });
      if (!r.ok) throw new Error(r.error.message);

      const snapshot: CameraSnapshot = {
        cameraId, cameraName: frame.name,
        snapshotUrl: frame.url, capturedAt: frame.capturedAt,
      };
      return provResult<VisionAnalysis>({
        data: { description: r.data, cameraId, cameraName: frame.name },
        sources: [
          provSource({ type: 'camera', identifier: `camera.${cameraId}`, startMs: start }),
          provSource({ type: 'ai_model', identifier: 'claude-sonnet-4-6-20251022', startMs: start }),
        ],
        confidence: 0.85,
        citations: [{ label: frame.name, url: `/iot/cameras/${cameraId}` }],
        cameraSnapshots: [snapshot],
      });
    });
  }
}

// Re-export so the registry can wire the snapshot tool alongside.
export { GetCameraSnapshotTool };
