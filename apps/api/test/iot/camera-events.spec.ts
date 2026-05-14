/**
 * test/iot/camera-events.spec.ts
 *
 * Camera-event severity routing, dedup window, face recognition thresholds.
 */

interface CameraEvent { cameraId: number; type: 'motion' | 'safety_violation' | 'fire' | 'intrusion'; ts: number; frameUrl: string }

function classifySeverity(ev: CameraEvent): 'info' | 'warn' | 'critical' {
  if (ev.type === 'fire' || ev.type === 'intrusion') return 'critical';
  if (ev.type === 'safety_violation') return 'warn';
  return 'info';
}

function dedupEvents(events: CameraEvent[], windowMs: number): CameraEvent[] {
  const seen = new Map<string, number>();
  const result: CameraEvent[] = [];
  for (const ev of events) {
    const key = `${ev.cameraId}:${ev.type}`;
    const last = seen.get(key);
    if (last === undefined || ev.ts - last > windowMs) {
      result.push(ev);
      seen.set(key, ev.ts);
    }
  }
  return result;
}

describe('Camera event severity', () => {
  it('fire → critical', () => {
    expect(classifySeverity({ cameraId: 1, type: 'fire', ts: 0, frameUrl: 'x' })).toBe('critical');
  });

  it('intrusion → critical', () => {
    expect(classifySeverity({ cameraId: 1, type: 'intrusion', ts: 0, frameUrl: 'x' })).toBe('critical');
  });

  it('safety_violation → warn', () => {
    expect(classifySeverity({ cameraId: 1, type: 'safety_violation', ts: 0, frameUrl: 'x' })).toBe('warn');
  });

  it('motion → info', () => {
    expect(classifySeverity({ cameraId: 1, type: 'motion', ts: 0, frameUrl: 'x' })).toBe('info');
  });
});

describe('Camera event dedup', () => {
  it('drops duplicates within window', () => {
    const events: CameraEvent[] = [
      { cameraId: 1, type: 'motion', ts: 0, frameUrl: 'a' },
      { cameraId: 1, type: 'motion', ts: 500, frameUrl: 'b' },
      { cameraId: 1, type: 'motion', ts: 2000, frameUrl: 'c' },
    ];
    expect(dedupEvents(events, 1000)).toHaveLength(2);
  });

  it('different cameras / types are not deduped', () => {
    const events: CameraEvent[] = [
      { cameraId: 1, type: 'motion', ts: 0, frameUrl: 'a' },
      { cameraId: 2, type: 'motion', ts: 0, frameUrl: 'b' },
      { cameraId: 1, type: 'fire', ts: 0, frameUrl: 'c' },
    ];
    expect(dedupEvents(events, 1000)).toHaveLength(3);
  });

  it('empty input → empty output', () => {
    expect(dedupEvents([], 1000)).toEqual([]);
  });
});

// ─── Face recognition match threshold ───────────────────────────────────────

const MATCH_THRESHOLD = 0.85;

function isMatch(similarity: number): { ok: boolean; match?: boolean; error?: string } {
  if (!Number.isFinite(similarity)) return { ok: false, error: 'NON_FINITE' };
  if (similarity < 0 || similarity > 1) return { ok: false, error: 'OUT_OF_RANGE' };
  return { ok: true, match: similarity >= MATCH_THRESHOLD };
}

describe('Face recognition threshold', () => {
  it('similarity at threshold → match', () => {
    expect(isMatch(0.85).match).toBe(true);
  });

  it('similarity below threshold → no match', () => {
    expect(isMatch(0.84).match).toBe(false);
  });

  it('high similarity (0.99) → match', () => {
    expect(isMatch(0.99).match).toBe(true);
  });

  it('invalid range (1.5) → error', () => {
    expect(isMatch(1.5).ok).toBe(false);
  });

  it('NaN → error', () => {
    expect(isMatch(NaN).ok).toBe(false);
  });
});
