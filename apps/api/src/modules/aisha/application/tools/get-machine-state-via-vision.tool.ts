/**
 * @module get-machine-state-via-vision.tool
 */

// NOTE: (RULE4_EXCEPTION) AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';
import type { CameraSnapshot } from '../../domain/value-objects/tool-call.vo';
import { CAMERA_SNAPSHOT_PROVIDER, type ICameraSnapshotProvider } from './get-camera-snapshot.tool';
import { CLAUDE_PORT, IClaudePort } from '../../domain/ports/i-claude-port';

export interface VisionMachineState {
  machineId:     string;
  visualState:   'running' | 'stopped' | 'error' | 'unknown';
  sensorState:   string;
  match:         boolean;
  cameraName:    string | null;
}

@Injectable()
export class GetMachineStateViaVisionTool implements IAishaTool {
  readonly definition = {
    name: 'get_machine_state_via_vision',
    description: 'Mashinaning visual holatini IoT sensor bilan solishtirish.',
    input_schema: {
      type: 'object' as const,
      properties: { machineId: { type: 'string' } },
      required: ['machineId'],
    },
  };

  constructor(
    @Inject(CLAUDE_PORT) private readonly claude: IClaudePort,
    @Optional() @Inject(CAMERA_SNAPSHOT_PROVIDER)
    private readonly provider: ICameraSnapshotProvider | null = null,
  ) {}

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<VisionMachineState>>> {
    const machineId = String(input['machineId'] ?? '');
    if (!machineId) return Err(AppErr('VALIDATION', 'machineId majburiy'));

    try {
      const start = Date.now();
      const sensor = rowsOf<{ state: string; camera_id: string | null }>(await db.execute(sql`
        SELECT current_state AS state, camera_id FROM iot_machine_registry WHERE id = ${machineId} LIMIT 1
      `))[0];
      if (!sensor) return Err(AppErr('NOT_FOUND', `Mashina topilmadi: ${machineId}`));

      let visualState: VisionMachineState['visualState'] = 'unknown';
      let cameraName: string | null = null;
      const cameraSnapshots: CameraSnapshot[] = [];
      const sources = [provSource({ type: 'iot_sensor', identifier: 'iot.machine_registry', startMs: start, rowCount: 1 })];

      if (sensor.camera_id && this.provider) {
        const frame = await this.provider.captureFrame(sensor.camera_id);
        cameraName = frame.name;
        cameraSnapshots.push({
          cameraId: sensor.camera_id, cameraName: frame.name,
          snapshotUrl: frame.url, capturedAt: frame.capturedAt,
        });
        sources.push(provSource({ type: 'camera', identifier: `camera.${sensor.camera_id}`, startMs: start }));
        if (frame.base64) {
          const r = await this.claude.sendOneShot({
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame.base64 } },
                { type: 'text', text: 'Mashina hozir ishlayaptimi? Faqat birinchi so\'z bilan javob bering: running, stopped, error.' },
              ],
            }],
            maxTokens: 16,
          });
          if (r.ok) {
            const w = r.data.toLowerCase();
            if (w.includes('running')) visualState = 'running';
            else if (w.includes('stop')) visualState = 'stopped';
            else if (w.includes('error')) visualState = 'error';
          }
          sources.push(provSource({ type: 'ai_model', identifier: 'claude-sonnet-4-6-20251022', startMs: start }));
        }
      }

      const match = visualState !== 'unknown' && visualState === sensor.state;
      return Ok(provResult<VisionMachineState>({
        data: { machineId, visualState, sensorState: sensor.state, match, cameraName },
        sources,
        confidence: visualState === 'unknown' ? 0.5 : 0.85,
        cameraSnapshots,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Err(AppErr('EXTERNAL_SERVICE', msg));
    }
  }
}
