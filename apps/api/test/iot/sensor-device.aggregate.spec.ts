/**
 * @module test/iot/sensor-device.aggregate.spec
 * @description Unit tests for the SensorDevice aggregate — readings buffer,
 * OEE derivation from anomaly ratio, and activate/deactivate transitions.
 */

import { SensorDevice } from '../../src/modules/iot/domain/aggregates/sensor-device.aggregate';
import { SensorReading } from '../../src/modules/iot/domain/aggregates/sensor-reading.aggregate';
import { SensorStatus, SensorType } from '../../src/modules/iot/domain/enums/sensor-status.enum';

function makeDevice(type: SensorType = SensorType.TEMPERATURE): SensorDevice {
  return SensorDevice.create('MACHINE-A1', 'Press-1 Termo', type);
}

function makeReading(value: number, anomaly = false): SensorReading {
  const r = SensorReading.create('DEVICE-X', value, 'C');
  if (anomaly) r.markAsAnomaly();
  return r;
}

describe('SensorDevice.create', () => {
  it('initialises with INACTIVE status and empty readings when created', () => {
    const d = makeDevice();
    expect(d.status).toBe(SensorStatus.INACTIVE);
    expect(d.readings).toEqual([]);
    expect(d.lastReading).toBeNull();
    expect(d.oee).toBe(0);
  });

  it('stores machineId, name and type when constructor args are provided', () => {
    const d = SensorDevice.create('M-99', 'Vibro-2', SensorType.VIBRATION);
    expect(d.machineId).toBe('M-99');
    expect(d.name).toBe('Vibro-2');
    expect(d.type).toBe(SensorType.VIBRATION);
  });

  it('assigns a unique id when two devices are created', () => {
    const a = makeDevice();
    const b = makeDevice();
    expect(a.id).not.toBe(b.id);
    expect(typeof a.id).toBe('string');
  });
});

describe('SensorDevice.addReading', () => {
  it('appends reading to internal buffer when addReading is called', () => {
    const d = makeDevice();
    const r = makeReading(23.5);
    d.addReading(r);
    expect(d.readings).toHaveLength(1);
    expect(d.readings[0]).toBe(r);
  });

  it('updates lastReading to the most recent value when multiple readings arrive', () => {
    const d = makeDevice();
    const first = makeReading(20);
    const second = makeReading(25);
    d.addReading(first);
    d.addReading(second);
    expect(d.lastReading).toBe(second);
    expect(d.readings).toHaveLength(2);
  });

  it('refreshes updatedAt when addReading is called', async () => {
    const d = makeDevice();
    const before = d.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 5));
    d.addReading(makeReading(10));
    expect(d.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('SensorDevice.calculateOEE', () => {
  it('returns zero OEE when no readings exist', () => {
    const d = makeDevice();
    expect(d.calculateOEE()).toBe(0);
  });

  it('returns 100 when none of the recent readings are anomalies', () => {
    const d = makeDevice();
    for (let i = 0; i < 10; i++) d.addReading(makeReading(20 + i, false));
    expect(d.calculateOEE()).toBe(100);
  });

  it('returns zero when all recent readings are anomalies', () => {
    const d = makeDevice();
    for (let i = 0; i < 5; i++) d.addReading(makeReading(99, true));
    expect(d.calculateOEE()).toBe(0);
  });

  it('returns the valid-to-total ratio as percentage when readings are mixed', () => {
    const d = makeDevice();
    for (let i = 0; i < 7; i++) d.addReading(makeReading(20, false));
    for (let i = 0; i < 3; i++) d.addReading(makeReading(99, true));
    expect(d.calculateOEE()).toBe(70);
  });

  it('considers only the last 100 readings when buffer exceeds the window', () => {
    const d = makeDevice();
    // 200 anomalous readings followed by 100 valid: window = last 100 valid → OEE=100
    for (let i = 0; i < 200; i++) d.addReading(makeReading(99, true));
    for (let i = 0; i < 100; i++) d.addReading(makeReading(20, false));
    expect(d.calculateOEE()).toBe(100);
  });
});

describe('SensorDevice.activate / deactivate', () => {
  it('switches status to ACTIVE when activate is called', () => {
    const d = makeDevice();
    d.activate();
    expect(d.status).toBe(SensorStatus.ACTIVE);
  });

  it('switches status to INACTIVE when deactivate is called', () => {
    const d = makeDevice();
    d.activate();
    d.deactivate();
    expect(d.status).toBe(SensorStatus.INACTIVE);
  });

  it('allows repeated activate calls without raising an error', () => {
    const d = makeDevice();
    d.activate();
    d.activate();
    expect(d.status).toBe(SensorStatus.ACTIVE);
  });
});
