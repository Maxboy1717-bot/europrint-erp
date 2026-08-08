/**
 * test/pos/movement-line-batch.dto.spec.ts
 *
 * Vision 19-pos #25 (FIFO/FEFO partiya): the KIRIM line's batch/lot must persist. The FE sent
 * `batchNumber`, but AddMovementLineSchema is strict (no .passthrough()) so it was stripped
 * before the service saw it, and `lotNumber` was accepted-then-dropped in addLines. This pins the
 * schema so batchNumber/lotNumber survive parse (the service now writes them to
 * pos_movement_lines.batch_number / lot_number, mapped ADD-ONLY in the Drizzle def).
 */

import { AddMovementLineSchema } from '../../src/modules/pos/dto/movement.dto';

describe('AddMovementLineSchema — batch/lot fields', () => {
  it('preserves batchNumber + lotNumber (batchNumber was stripped by the strict schema)', () => {
    const parsed = AddMovementLineSchema.parse({
      materialCardId: 1, quantity: 5, batchNumber: 'LOT-42', lotNumber: 'SER-7',
    });
    expect(parsed.batchNumber).toBe('LOT-42');
    expect(parsed.lotNumber).toBe('SER-7');
  });

  it('leaves batch/lot undefined when not provided (no fabrication)', () => {
    const parsed = AddMovementLineSchema.parse({ materialCardId: 1, quantity: 5 });
    expect(parsed.batchNumber).toBeUndefined();
    expect(parsed.lotNumber).toBeUndefined();
  });
});
