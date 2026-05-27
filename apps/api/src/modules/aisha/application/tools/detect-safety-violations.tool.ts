/**
 * @module detect-safety-violations.tool
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';
import type { CameraSnapshot } from '../../domain/value-objects/tool-call.vo';
import { CAMERA_SNAPSHOT_PROVIDER, type ICameraSnapshotProvider } from './get-camera-snapshot.tool';
import { CLAUDE_PORT, IClaudePort } from '../../domain/ports/i-claude-port';

export interface SafetyViolation {
  kind:     'missing_helmet' | 'missing_vest' | 'restricted_area' | 'guard_removed' | 'other';
  severity: 'low' | 'medium' | 'high';
  details:  string;
}

export interface SafetyViolationsResult {
  violations:  SafetyViolation[];
  cameraName:  string;
  snapshotUrl: string;
}

const PROMPT = `Quyidagi suratni xavfsizlik buzilishlari uchun tahlil qiling:
1) kaska yo'q (missing_helmet)
2) jilet yo'q (missing_vest)
3) man qilingan hududga kirish (restricted_area)
4) mashina himoyasi olib tashlangan (guard_removed)
Har bir buzilish uchun JSON qator qaytaring: {kind, severity (low/medium/high), details}.
Buzilish yo'q bo'lsa bo'sh array [] qaytaring.`;

@Injectable()
export class DetectSafetyViolationsTool implements IAishaTool {
  readonly definition = {
    name: 'detect_safety_violations',
    description: 'Xavfsizlik buzilishlarini AI vision orqali aniqlash.',
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

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<SafetyViolationsResult>>> {
    const id = String(input['cameraId'] ?? input['areaId'] ?? '');
    if (!id) return Err(AppErr('VALIDATION', 'cameraId yoki areaId majburiy'));
    const provider = this.provider;
    if (!provider) return Err(AppErr('EXTERNAL_SERVICE', 'CameraSnapshotProvider ulanmagan'));

    try {
      const start = Date.now();
      const frame = await provider.captureFrame(id);
      if (!frame.base64) return Err(AppErr('EXTERNAL_SERVICE', 'Frame base64 yo\'q'));

      const r = await this.claude.sendOneShot({
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame.base64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
        maxTokens: 512,
      });
      if (!r.ok) return Err(AppErr('EXTERNAL_SERVICE', r.error.message));

      const violations = this.parseViolations(r.data);
      const snapshot: CameraSnapshot = {
        cameraId: id, cameraName: frame.name,
        snapshotUrl: frame.url, capturedAt: frame.capturedAt,
      };
      return Ok(provResult<SafetyViolationsResult>({
        data: { violations, cameraName: frame.name, snapshotUrl: frame.url },
        sources: [
          provSource({ type: 'camera', identifier: `camera.${id}`, startMs: start }),
          provSource({ type: 'ai_model', identifier: 'claude-sonnet-4-6-20251022', startMs: start }),
        ],
        confidence: 0.78,
        cameraSnapshots: [snapshot],
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Err(AppErr('EXTERNAL_SERVICE', msg));
    }
  }

  private parseViolations(raw: string): SafetyViolation[] {
    const m = raw.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try {
      const parsed = JSON.parse(m[0]) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((v): v is SafetyViolation =>
        typeof v === 'object' && v !== null && 'kind' in v && 'severity' in v);
    } catch {
      return [];
    }
  }
}
