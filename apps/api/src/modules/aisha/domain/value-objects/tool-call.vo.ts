/**
 * @module tool-call.vo
 * @description Immutable record of one tool invocation by the LLM. The
 * `provenance` field is mandatory — every answer AIsha gives must be
 * traceable to its source(s).
 */

import { Result, Ok, Err, AppErr } from '@common/result';

export type SourceType = 'database' | 'api' | 'camera' | 'iot_sensor' | 'ai_model' | 'cache';
export type Freshness  = 'live' | 'cached' | 'stale';

export interface ProvenanceSource {
  type:        SourceType;
  identifier:  string;
  queriedAt:   string;
  rowCount?:   number;
  latencyMs:   number;
  freshness:   Freshness;
}

export interface Citation {
  label:    string;
  url?:     string;
  snippet?: string;
}

export interface CameraSnapshot {
  cameraId:    string;
  cameraName:  string;
  snapshotUrl: string;
  capturedAt:  string;
}

export interface Provenance {
  sources:          ProvenanceSource[];
  confidence:       number;
  citations:        Citation[];
  cameraSnapshots?: CameraSnapshot[];
}

export interface ToolCallProps {
  toolName:   string;
  input:      Record<string, unknown>;
  output:     unknown;
  provenance: Provenance;
}

export class ToolCall {
  private constructor(public readonly props: Readonly<ToolCallProps>) {}

  static create(props: ToolCallProps): Result<ToolCall> {
    if (!props.toolName || props.toolName.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'ToolCall: toolName bo\'sh bo\'lmasligi kerak'));
    }
    if (!props.provenance) {
      return Err(AppErr('VALIDATION', 'ToolCall: provenance majburiy'));
    }
    if (!Array.isArray(props.provenance.sources) || props.provenance.sources.length === 0) {
      return Err(AppErr('VALIDATION', 'ToolCall: kamida bitta provenance.source bo\'lishi kerak'));
    }
    if (props.provenance.confidence < 0 || props.provenance.confidence > 1) {
      return Err(AppErr('VALIDATION', 'ToolCall: provenance.confidence 0..1'));
    }
    return Ok(new ToolCall(props));
  }
}
