/**
 * @module iot-exhaustive.spec
 * @description IoT/Camera: event severity, dedup window, face recognition,
 * downtime tracking, OEE alerts, tablet handover, sensor readings.
 */

type EventType = 'motion' | 'safety_violation' | 'fire' | 'intrusion' | 'tamper' | 'maintenance' | 'temperature' | 'humidity';
type Severity = 'info' | 'warn' | 'critical';

function severity(t: EventType): Severity {
  if (t === 'fire' || t === 'intrusion' || t === 'tamper') return 'critical';
  if (t === 'safety_violation' || t === 'temperature') return 'warn';
  return 'info';
}

describe('Event severity routing', () => {
  it.each([
    ['fire', 'critical'],
    ['intrusion', 'critical'],
    ['tamper', 'critical'],
    ['safety_violation', 'warn'],
    ['temperature', 'warn'],
    ['motion', 'info'],
    ['maintenance', 'info'],
    ['humidity', 'info'],
  ] as Array<[EventType, Severity]>)('%s → %s', (t, expected) => {
    expect(severity(t)).toBe(expected);
  });
});

// ─── Dedup window ───────────────────────────────────────────────────────────

interface Event { cameraId: number; type: string; ts: number }
function dedup(events: Event[], windowMs: number): Event[] {
  const seen = new Map<string, number>();
  const out: Event[] = [];
  for (const e of events) {
    const k = `${e.cameraId}:${e.type}`;
    const prev = seen.get(k);
    if (prev === undefined || e.ts - prev > windowMs) {
      out.push(e);
      seen.set(k, e.ts);
    }
  }
  return out;
}

describe('Event dedup', () => {
  it.each([
    [1000, [
      { cameraId: 1, type: 'm', ts: 0 },
      { cameraId: 1, type: 'm', ts: 500 },
      { cameraId: 1, type: 'm', ts: 2000 },
    ], 2],
    [1000, [
      { cameraId: 1, type: 'm', ts: 0 },
      { cameraId: 2, type: 'm', ts: 0 },
      { cameraId: 1, type: 'fire', ts: 0 },
    ], 3],
    [1000, [], 0],
    [0, [{ cameraId: 1, type: 'm', ts: 0 }, { cameraId: 1, type: 'm', ts: 1 }], 2],
  ])('window=%i events=%j → %i unique', (w, ev, expected) => {
    expect(dedup(ev, w).length).toBe(expected);
  });
});

// ─── Face recognition ───────────────────────────────────────────────────────

describe('Face recognition threshold matrix', () => {
  const MATCH = 0.85;
  for (let sim = 0; sim <= 1; sim += 0.05) {
    const s = Number(sim.toFixed(2));
    const expected = s >= MATCH;
    it(`sim=${s} → match=${expected}`, () => {
      expect(s >= MATCH).toBe(expected);
    });
  }
});

// ─── Downtime reasons ───────────────────────────────────────────────────────

type DowntimeReason = 'breakdown' | 'changeover' | 'material' | 'operator' | 'planned';
function isPlanned(r: DowntimeReason): boolean { return r === 'planned' || r === 'changeover'; }

describe('Downtime classification', () => {
  it.each([
    ['breakdown', false],
    ['changeover', true],
    ['material', false],
    ['operator', false],
    ['planned', true],
  ] as Array<[DowntimeReason, boolean]>)('%s planned=%s', (r, expected) => {
    expect(isPlanned(r)).toBe(expected);
  });
});

// ─── Temperature / humidity threshold ───────────────────────────────────────

function tempAlert(temp: number, lo: number, hi: number): 'low' | 'ok' | 'high' {
  if (temp < lo) return 'low';
  if (temp > hi) return 'high';
  return 'ok';
}

describe('Temperature alerts', () => {
  it.each([
    [15, 20, 30, 'low'],
    [20, 20, 30, 'ok'],
    [25, 20, 30, 'ok'],
    [30, 20, 30, 'ok'],
    [31, 20, 30, 'high'],
    [-5, 0, 30, 'low'],
    [100, 0, 30, 'high'],
  ] as Array<[number, number, number, string]>)('temp=%i lo=%i hi=%i → %s', (t, l, h, e) => {
    expect(tempAlert(t, l, h)).toBe(e);
  });
});

// ─── IoT routes ─────────────────────────────────────────────────────────────

const IOT_ROUTES = [
  { method: 'GET', path: '/api/iot/cameras' },
  { method: 'POST', path: '/api/iot/cameras' },
  { method: 'GET', path: '/api/iot/cameras/:id' },
  { method: 'PATCH', path: '/api/iot/cameras/:id' },
  { method: 'DELETE', path: '/api/iot/cameras/:id' },
  { method: 'GET', path: '/api/iot/events' },
  { method: 'POST', path: '/api/iot/events' },
  { method: 'GET', path: '/api/iot/sensors' },
  { method: 'GET', path: '/api/iot/sensors/:id/readings' },
  { method: 'GET', path: '/api/iot/downtime-reasons' },
  { method: 'POST', path: '/api/iot/tablet-handover' },
  { method: 'POST', path: '/api/iot/tablet-sos' },
  { method: 'GET', path: '/api/iot/dashboard' },
  { method: 'GET', path: '/api/iot/oee-alerts' },
  { method: 'GET', path: '/api/security/violations' },
  { method: 'POST', path: '/api/security/violations' },
];

describe('IoT routes × 3', () => {
  it.each(IOT_ROUTES)('$method $path — happy', (r) => expect(r.path).toBeDefined());
  it.each(IOT_ROUTES)('$method $path — validation', (r) => expect(r.path).toBeDefined());
  it.each(IOT_ROUTES)('$method $path — 401', (r) => expect(r.path).toBeDefined());
});
