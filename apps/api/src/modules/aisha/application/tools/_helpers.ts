/**
 * @module aisha/tools/_helpers
 * @description Shared helpers used by every AIsha tool to keep the
 * provenance shape consistent. Tools call `provSource()` and `provResult()`
 * instead of inlining provenance objects so the format never drifts.
 */

import type { Provenance, ProvenanceSource, Citation, CameraSnapshot, SourceType, Freshness } from '../../domain/value-objects/tool-call.vo';
import type { ToolResult } from '../../domain/tool.interface';

export function provSource(input: {
  type:        SourceType;
  identifier:  string;
  startMs:     number;
  rowCount?:   number;
  freshness?:  Freshness;
}): ProvenanceSource {
  return {
    type:       input.type,
    identifier: input.identifier,
    queriedAt:  new Date().toISOString(),
    rowCount:   input.rowCount,
    latencyMs:  Math.max(0, Date.now() - input.startMs),
    freshness:  input.freshness ?? 'live',
  };
}

export function provResult<T>(input: {
  data:             T;
  sources:          ProvenanceSource[];
  confidence?:      number;
  citations?:       Citation[];
  cameraSnapshots?: CameraSnapshot[];
}): ToolResult<T> {
  const provenance: Provenance = {
    sources:    input.sources,
    confidence: input.confidence ?? 1,
    citations:  input.citations ?? [],
  };
  if (input.cameraSnapshots) provenance.cameraSnapshots = input.cameraSnapshots;
  return { data: input.data, provenance };
}

/** Normalises Drizzle execute results that may be either {rows} or an array. */
export function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === 'object' && Array.isArray((r as { rows: unknown[] }).rows)) {
    return (r as { rows: T[] }).rows;
  }
  return [];
}
