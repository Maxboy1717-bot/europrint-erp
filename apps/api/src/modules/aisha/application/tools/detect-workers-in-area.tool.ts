/**
 * @module detect-workers-in-area.tool
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';
import type { CameraSnapshot } from '../../domain/value-objects/tool-call.vo';
import { CAMERA_SNAPSHOT_PROVIDER, type ICameraSnapshotProvider } from './get-camera-snapshot.tool';
import { CLAUDE_PORT, IClaudePort } from '../../domain/ports/i-claude-port';

export interface WorkerCount {
  count:       number;
  confidence:  number;
  cameraName:  string;
  snapshotUrl: string;
}

@Injectable()
export class DetectWorkersInAreaTool implements IAishaTool {
  readonly definition = {
    name: 'detect_workers_in_area',
    description: 'Hududda nechta ishchi borligini AI vision yordamida sanash.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cameraId: { type: 'string' },
        areaId:   { type: 'string' },
      },
    },
  };

  constructor(
    @Inject(CLAUDE_PORT) private readonly claude: IClaudePort,
    @Optional() @Inject(CAMERA_SNAPSHOT_PROVIDER)
    private readonly provider: ICameraSnapshotProvider | null = null,
  ) {}

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<WorkerCount>>> {
    const cameraId = String(input['cameraId'] ?? input['areaId'] ?? '');
    if (!cameraId) return Err(AppErr('VALIDATION', 'cameraId yoki areaId majburiy'));
    const provider = this.provider;
    if (!provider) return Err(AppErr('EXTERNAL_SERVICE', 'CameraSnapshotProvider ulanmagan'));

    try {
      const start = Date.now();
      const frame = await provider.captureFrame(cameraId);
      if (!frame.base64) return Err(AppErr('EXTERNAL_SERVICE', 'Frame base64 yo\'q'));

      const r = await this.claude.sendOneShot({
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame.base64 } },
            { type: 'text', text: 'Suratdagi ishchilarni sanang. Faqat raqam qaytaring.' },
          ],
        }],
        maxTokens: 32,
      });
      if (!r.ok) return Err(AppErr('EXTERNAL_SERVICE', r.error.message));
      const count = parseInt((r.data.match(/\d+/) ?? ['0'])[0], 10);

      const snapshot: CameraSnapshot = {
        cameraId, cameraName: frame.name, snapshotUrl: frame.url, capturedAt: frame.capturedAt,
      };
      return Ok(provResult<WorkerCount>({
        data: { count, confidence: 0.8, cameraName: frame.name, snapshotUrl: frame.url },
        sources: [
          provSource({ type: 'camera', identifier: `camera.${cameraId}`, startMs: start }),
          provSource({ type: 'ai_model', identifier: 'claude-sonnet-4-6-20251022', startMs: start }),
        ],
        confidence: 0.8,
        cameraSnapshots: [snapshot],
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Err(AppErr('EXTERNAL_SERVICE', msg));
    }
  }
}
