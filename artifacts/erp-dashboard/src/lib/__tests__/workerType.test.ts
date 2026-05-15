/**
 * @module workerType.test
 * @description Vitest tests for the computeWorkerType classifier.
 */

import { describe, it, expect } from 'vitest';
import {
  computeWorkerType,
  WORKER_TYPE_META,
  type WorkerTypeInput,
} from '../workerType';

function base(over: Partial<WorkerTypeInput>): WorkerTypeInput {
  return {
    motivation_level: 2,
    tool_test_score: 50,
    avg_score: 6,
    ...over,
  };
}

describe('computeWorkerType', () => {
  it('returns TRABLDAYKER when syndrome10 (I<-30, J<-30) is present', () => {
    const result = computeWorkerType(base({
      tool_test_results: { I: -40, J: -50 },
    }));
    expect(result).toBe('TRABLDAYKER');
  });

  it('returns TRABLDAYKER when syndrome11 (G<-30, C<-30) is present', () => {
    const result = computeWorkerType(base({
      tool_test_results: { G: -35, C: -32 },
    }));
    expect(result).toBe('TRABLDAYKER');
  });

  it('returns FLAGMAN for high motivation + inflow + high avg', () => {
    const result = computeWorkerType(base({
      motivation_level: 4,
      tool_test_score: 80,
      flow_direction: 'inflow',
      avg_score: 8,
    }));
    expect(result).toBe('FLAGMAN');
  });

  it('returns FLAGMAN when motivation=3 with high tool score', () => {
    const result = computeWorkerType(base({
      motivation_level: 3,
      tool_test_score: 70,
      avg_score: 7,
    }));
    expect(result).toBe('FLAGMAN');
  });

  it('returns TRABLDAYKER for low motivation and low tool', () => {
    const result = computeWorkerType(base({
      motivation_level: 1,
      tool_test_score: 10,
      avg_score: 3,
    }));
    expect(result).toBe('TRABLDAYKER');
  });

  it('returns TRABLDAYKER for outflow-only with low tool and low avg', () => {
    const result = computeWorkerType(base({
      motivation_level: 2,
      tool_test_score: 20,
      flow_direction: 'outflow',
      avg_score: 3,
    }));
    expect(result).toBe('TRABLDAYKER');
  });

  it('defaults to PROTSESSNIK for average worker', () => {
    const result = computeWorkerType(base({
      motivation_level: 2,
      tool_test_score: 50,
      avg_score: 6,
    }));
    expect(result).toBe('PROTSESSNIK');
  });

  it('uses tool_test_passed map when score is omitted', () => {
    const result = computeWorkerType({
      motivation_level: 3,
      tool_test_passed: { a: true, b: true, c: true, d: true, e: true, f: true, g: false, h: false, i: false, j: false },
      avg_score: 7,
    });
    expect(result).toBe('FLAGMAN');
  });
});

describe('WORKER_TYPE_META', () => {
  it('contains all three worker types', () => {
    expect(WORKER_TYPE_META.FLAGMAN).toBeDefined();
    expect(WORKER_TYPE_META.PROTSESSNIK).toBeDefined();
    expect(WORKER_TYPE_META.TRABLDAYKER).toBeDefined();
  });

  it('each entry has label/emoji/color/bg/border/desc', () => {
    for (const key of ['FLAGMAN', 'PROTSESSNIK', 'TRABLDAYKER'] as const) {
      const meta = WORKER_TYPE_META[key];
      expect(typeof meta.label).toBe('string');
      expect(typeof meta.emoji).toBe('string');
      expect(typeof meta.color).toBe('string');
      expect(typeof meta.bg).toBe('string');
      expect(typeof meta.border).toBe('string');
      expect(typeof meta.desc).toBe('string');
    }
  });
});
