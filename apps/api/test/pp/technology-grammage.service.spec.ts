/**
 * test/pp/technology-grammage.service.spec.ts
 *
 * Behavioral spec for TechnologyGrammageService's `buildLayers()` — the pure
 * take-up-factor resolution rule feeding Formula 3 (grammage = liner1 + liner2
 * + flute×take_up). `computeForCard`/`setMaterialLayers` are DB-orchestration
 * wrappers (typedExecute/db.transaction) out of scope for a unit spec; the
 * provenance logic in `buildLayers` is real, DB-free business logic (which
 * take-up source wins: layer-row override vs pp_flute_types vs unset — never
 * a fabricated 1.0) and is exercised directly here via the class instance.
 *
 * `@shared/db` / `@shared/db/typed-execute` are mocked purely so importing the
 * service module has no live-DB side effects (established pattern — see
 * test/pp/get-mrp-report.handler.spec.ts, test/pp/pp-crp.service.spec.ts).
 */

jest.mock('@shared/db', () => ({ db: {} }));
jest.mock('@shared/db/typed-execute', () => ({ typedExecute: jest.fn() }));

import { TechnologyGrammageService } from '../../src/modules/pp/technology/technology-grammage.service';
import { GofraConversionService } from '../../src/modules/pp/conversion/gofra-conversion.service';
import type { IGofraFactorsRepo } from '../../src/modules/pp/conversion/i-gofra-factors.repo';
import type { FluteFactorConfig } from '../../src/modules/pp/conversion/gofra-conversion.types';
import { Ok } from '@common/result';

interface LayerRow {
  layer_index: number;
  role: string;
  gsm: string | number;
  flute_type: string | null;
  take_up_factor: string | number | null;
}

// buildLayers() never calls the repo (fluteFactors is passed in directly) —
// a minimal stub is enough to satisfy the constructor.
const fakeFactorsRepo: IGofraFactorsRepo = {
  getFluteFactors: async () => Ok({}),
  getFluteTypes: async () => Ok([]),
  updateFluteFactor: async () => Ok({ code: 'A', nameUz: '', nameRu: null, takeUpFactor: null, isActive: true }),
};

describe('TechnologyGrammageService.buildLayers (Formula 3 take-up provenance)', () => {
  const service = new TechnologyGrammageService(new GofraConversionService(), fakeFactorsRepo);

  // Private method — exercised directly since the public API (computeForCard/
  // setMaterialLayers) is a thin DB-orchestration wrapper around it.
  const buildLayers = (rows: LayerRow[], fluteFactors: FluteFactorConfig) =>
    (service as unknown as {
      buildLayers: (
        rows: LayerRow[],
        fluteFactors: FluteFactorConfig,
      ) => {
        resolved: Array<{
          layerIndex: number;
          role: string;
          gsm: number;
          fluteType: string | null;
          takeUpFactorUsed: number | null;
          takeUpSource: string | null;
        }>;
        engineLayers: Array<{ role: string; gsm: number; fluteType?: string | null }>;
        perFluteConfig: FluteFactorConfig;
      };
    }).buildLayers(rows, fluteFactors);

  it('liner rows never get a take-up factor or source', () => {
    const { resolved, engineLayers, perFluteConfig } = buildLayers(
      [{ layer_index: 0, role: 'liner', gsm: 205, flute_type: null, take_up_factor: null }],
      {},
    );
    expect(resolved).toEqual([
      {
        layerIndex: 0,
        role: 'liner',
        gsm: 205,
        fluteType: null,
        takeUpFactorUsed: null,
        takeUpSource: null,
      },
    ]);
    expect(engineLayers).toEqual([{ role: 'liner', gsm: 205 }]);
    expect(perFluteConfig).toEqual({});
  });

  it("flute row's explicit layer_row take_up_factor overrides pp_flute_types master value", () => {
    const { resolved, perFluteConfig } = buildLayers(
      [{ layer_index: 1, role: 'flute', gsm: 127, flute_type: 'BC', take_up_factor: 1.5 }],
      { BC: 1.43 },
    );
    expect(resolved[0].takeUpFactorUsed).toBe(1.5);
    expect(resolved[0].takeUpSource).toBe('layer_row');
    // The engine is fed the resolved (override) value, not the master one.
    expect(perFluteConfig.BC).toBe(1.5);
  });

  it('falls back to the pp_flute_types master factor when no layer_row override is set', () => {
    const { resolved, perFluteConfig } = buildLayers(
      [{ layer_index: 1, role: 'flute', gsm: 100, flute_type: 'C', take_up_factor: null }],
      { C: 1.45 },
    );
    expect(resolved[0].takeUpFactorUsed).toBe(1.45);
    expect(resolved[0].takeUpSource).toBe('flute_types');
    expect(perFluteConfig.C).toBe(1.45);
  });

  it('leaves the take-up factor unset (never guesses 1.0) when neither source has a value', () => {
    const { resolved, perFluteConfig } = buildLayers(
      [{ layer_index: 1, role: 'flute', gsm: 100, flute_type: 'E', take_up_factor: null }],
      { E: null },
    );
    expect(resolved[0].takeUpFactorUsed).toBeNull();
    expect(resolved[0].takeUpSource).toBe('unset');
    expect(perFluteConfig.E).toBeUndefined();
  });

  it('ignores non-positive/invalid overrides and master values (0, negative → not used)', () => {
    const { resolved } = buildLayers(
      [{ layer_index: 1, role: 'flute', gsm: 100, flute_type: 'A', take_up_factor: 0 }],
      { A: -1 },
    );
    expect(resolved[0].takeUpFactorUsed).toBeNull();
    expect(resolved[0].takeUpSource).toBe('unset');
  });

  it('an unrecognised flute code is never added to perFluteConfig, even with a numeric override', () => {
    const { resolved, engineLayers, perFluteConfig } = buildLayers(
      [{ layer_index: 2, role: 'flute', gsm: 90, flute_type: 'X', take_up_factor: 2 }],
      {},
    );
    // fluteType stays the raw string for display, but the resolved enum is null →
    // takeUpSource is forced 'unset' and the value never reaches the engine config.
    expect(resolved[0].fluteType).toBe('X');
    expect(resolved[0].takeUpSource).toBe('unset');
    expect(perFluteConfig.X).toBeUndefined();
    expect(engineLayers[0]).toEqual({ role: 'flute', gsm: 90, fluteType: 'X' });
  });

  it('resolves a mixed liner+flute stack (owner example: 205+205+127×BC) preserving order', () => {
    const { resolved, engineLayers, perFluteConfig } = buildLayers(
      [
        { layer_index: 0, role: 'liner', gsm: 205, flute_type: null, take_up_factor: null },
        { layer_index: 1, role: 'flute', gsm: 127, flute_type: 'BC', take_up_factor: null },
        { layer_index: 2, role: 'liner', gsm: 205, flute_type: null, take_up_factor: null },
      ],
      { BC: 1.43 },
    );
    expect(resolved.map((r) => r.role)).toEqual(['liner', 'flute', 'liner']);
    expect(engineLayers).toEqual([
      { role: 'liner', gsm: 205 },
      { role: 'flute', gsm: 127, fluteType: 'BC' },
      { role: 'liner', gsm: 205 },
    ]);
    expect(perFluteConfig).toEqual({ BC: 1.43 });
  });
});
