/**
 * @module test/mro/maintenance-order.aggregate.spec
 * @description Unit tests for the MaintenanceOrder aggregate — covers both
 * constructor overloads (legacy machine/type/date and equipment/priority),
 * lifecycle transitions and assignment side-effects.
 */

import { MaintenanceOrder } from '../../src/modules/mro/domain/aggregates/maintenance-order.aggregate';
import { MaintenanceStatus, MaintenanceType } from '../../src/modules/mro/domain/enums/maintenance-status.enum';

const SCHEDULED_DATE = new Date('2026-06-15T09:00:00Z');

function makeLegacyOrder(): MaintenanceOrder {
  return MaintenanceOrder.create('M-1', MaintenanceType.PREVENTIVE, 'Profilaktik', SCHEDULED_DATE);
}

function makeEquipmentOrder(priority: 'low' | 'medium' | 'high' | 'critical' = 'high'): MaintenanceOrder {
  return MaintenanceOrder.createForEquipment('EQ-9', 'Press Line A', 'Vibratsiya darajasi yuqori', priority);
}

describe('MaintenanceOrder.create (legacy)', () => {
  it('initialises status SCHEDULED when created via legacy factory', () => {
    const o = makeLegacyOrder();
    expect(o.status).toBe(MaintenanceStatus.SCHEDULED);
  });

  it('stores machineId, type, description and scheduledDate when legacy args are passed', () => {
    const o = makeLegacyOrder();
    expect(o.machineId).toBe('M-1');
    expect(o.type).toBe(MaintenanceType.PREVENTIVE);
    expect(o.description).toBe('Profilaktik');
    expect(o.scheduledDate).toEqual(SCHEDULED_DATE);
  });

  it('initialises technicianId, completionDate and completedAt to null when legacy', () => {
    const o = makeLegacyOrder();
    expect(o.technicianId).toBeNull();
    expect(o.completionDate).toBeNull();
    expect(o.completedAt).toBeNull();
    expect(o.assignedTo).toBeNull();
  });

  it('defaults priority to medium when legacy constructor is used', () => {
    const o = makeLegacyOrder();
    expect(o.priority).toBe('medium');
  });
});

describe('MaintenanceOrder.createForEquipment', () => {
  it('initialises status SCHEDULED and priority high when equipment factory is used', () => {
    const o = makeEquipmentOrder('high');
    expect(o.status).toBe(MaintenanceStatus.SCHEDULED);
    expect(o.priority).toBe('high');
  });

  it('stores equipmentId, equipmentName and issueDescription when created', () => {
    const o = makeEquipmentOrder('critical');
    expect(o.equipmentId).toBe('EQ-9');
    expect(o.equipmentName).toBe('Press Line A');
    expect(o.issueDescription).toBe('Vibratsiya darajasi yuqori');
    expect(o.priority).toBe('critical');
  });

  it('mirrors equipmentId onto legacy machineId when created via equipment factory', () => {
    const o = makeEquipmentOrder();
    expect(o.machineId).toBe('EQ-9');
  });

  it('defaults legacy type to PREVENTIVE when equipment constructor is used', () => {
    const o = makeEquipmentOrder();
    expect(o.type).toBe(MaintenanceType.PREVENTIVE);
  });

  it('assigns a unique id when two orders are created', () => {
    const a = makeEquipmentOrder();
    const b = makeEquipmentOrder();
    expect(a.id).not.toBe(b.id);
    expect(typeof a.id).toBe('string');
  });
});

describe('MaintenanceOrder.start', () => {
  it('transitions to IN_PROGRESS and stores technicianId when start is called', () => {
    const o = makeLegacyOrder();
    o.start(55);
    expect(o.status).toBe(MaintenanceStatus.IN_PROGRESS);
    expect(o.technicianId).toBe(55);
  });

  it('refreshes updatedAt when start is called', async () => {
    const o = makeLegacyOrder();
    const before = o.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 5));
    o.start(1);
    expect(o.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('overwrites previous technicianId when start is called twice', () => {
    const o = makeLegacyOrder();
    o.start(1);
    o.start(2);
    expect(o.technicianId).toBe(2);
  });
});

describe('MaintenanceOrder.complete', () => {
  it('transitions to COMPLETED and sets both completionDate and completedAt', () => {
    const o = makeLegacyOrder();
    o.start(1);
    o.complete();
    expect(o.status).toBe(MaintenanceStatus.COMPLETED);
    expect(o.completionDate).toBeInstanceOf(Date);
    expect(o.completedAt).toBeInstanceOf(Date);
  });

  it('allows complete to be called from SCHEDULED status as well', () => {
    const o = makeLegacyOrder();
    o.complete();
    expect(o.status).toBe(MaintenanceStatus.COMPLETED);
  });
});

describe('MaintenanceOrder.fail', () => {
  it('transitions to FAILED when fail is called', () => {
    const o = makeLegacyOrder();
    o.start(1);
    o.fail();
    expect(o.status).toBe(MaintenanceStatus.FAILED);
  });

  it('refreshes updatedAt when fail is called', async () => {
    const o = makeLegacyOrder();
    const before = o.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 5));
    o.fail();
    expect(o.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('overwrites COMPLETED status when fail is called afterwards', () => {
    const o = makeLegacyOrder();
    o.complete();
    o.fail();
    expect(o.status).toBe(MaintenanceStatus.FAILED);
  });
});

describe('MaintenanceOrder.assign', () => {
  it('stores assignedTo and transitions to IN_PROGRESS when assign is called', () => {
    const o = makeEquipmentOrder();
    o.assign('tech-77');
    expect(o.assignedTo).toBe('tech-77');
    expect(o.status).toBe(MaintenanceStatus.IN_PROGRESS);
  });

  it('overwrites previous assignedTo when assign is called twice', () => {
    const o = makeEquipmentOrder();
    o.assign('tech-1');
    o.assign('tech-2');
    expect(o.assignedTo).toBe('tech-2');
  });

  it('refreshes updatedAt when assign is called', async () => {
    const o = makeEquipmentOrder();
    const before = o.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 5));
    o.assign('tech-3');
    expect(o.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});
