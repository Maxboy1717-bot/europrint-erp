/**
 * test/iot/iot-tablet-session-schema.spec.ts
 *
 * Vision 16-iot: a tablet production session must carry its production order,
 * machine, and target quantity. The FE (useIoTTablet.createSession) sends
 * productionOrderId/equipmentId/targetQuantity, but ProductionSessionSchema only
 * declared orderId/machineId, so those three were dropped and the INSERT
 * hardcoded 0/0/0 -> MesCompletedEvent(ppId=0) (orphan QC), broken OEE, no
 * machine attribution. This pins the schema contract so the fields survive parse.
 */

import { ProductionSessionSchema } from '../../src/modules/iot/presentation/iot-tablet.schemas';

describe('ProductionSessionSchema — session-create field contract', () => {
  it('accepts + preserves the canonical FE fields (were silently dropped)', () => {
    const dto = ProductionSessionSchema.parse({ productionOrderId: 48, equipmentId: 4, targetQuantity: 2000 });
    expect(dto.productionOrderId).toBe(48);
    expect(dto.equipmentId).toBe(4);
    expect(dto.targetQuantity).toBe(2000);
  });

  it('keeps orderId/machineId/shiftId back-compat aliases', () => {
    const dto = ProductionSessionSchema.parse({ orderId: 7, machineId: 3, shiftId: 1 });
    expect(dto.orderId).toBe(7);
    expect(dto.machineId).toBe(3);
    expect(dto.shiftId).toBe(1);
  });

  it('accepts string ids too (union string|number)', () => {
    const dto = ProductionSessionSchema.parse({ productionOrderId: '48', targetQuantity: '2000' });
    expect(dto.productionOrderId).toBe('48');
    expect(dto.targetQuantity).toBe('2000');
  });
});
