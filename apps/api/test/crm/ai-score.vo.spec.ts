/**
 * ai-score.vo.spec.ts — AIScore value object tests.
 *
 * Covers 0..100 range validation, rounding behaviour, band classification
 * (high / medium / low), and equality semantics.
 */

import { AIScore } from '../../src/modules/crm/domain/value-objects/ai-score.vo';
import { leadFactory } from '../_fixtures/factories';

describe('AIScore value object', () => {
  it('returns Ok when score is at the lower bound 0', () => {
    const r = AIScore.create(0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe(0);
  });

  it('returns Ok when score is at the upper bound 100', () => {
    const r = AIScore.create(100);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.getValue()).toBe(100);
  });

  it('returns Err when score is below zero', () => {
    const r = AIScore.create(-1);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toMatch(/between 0 and 100/);
  });

  it('returns Err when score exceeds 100', () => {
    const r = AIScore.create(101);
    expect(r.ok).toBe(false);
  });

  it('rounds fractional scores to the nearest integer when create succeeds', () => {
    const r = AIScore.create(42.6);
    if (!r.ok) throw new Error('expected ok');
    expect(r.data.getValue()).toBe(43);
  });

  it('classifies scores >= 70 as high when isHighScore is queried', () => {
    const r = AIScore.create(85);
    if (!r.ok) throw new Error('expected ok');
    expect(r.data.isHighScore()).toBe(true);
    expect(r.data.isMediumScore()).toBe(false);
    expect(r.data.isLowScore()).toBe(false);
  });

  it('classifies scores in [40,70) as medium when isMediumScore is queried', () => {
    const r = AIScore.create(50);
    if (!r.ok) throw new Error('expected ok');
    expect(r.data.isMediumScore()).toBe(true);
    expect(r.data.isHighScore()).toBe(false);
    expect(r.data.isLowScore()).toBe(false);
  });

  it('classifies scores < 40 as low when isLowScore is queried', () => {
    const r = AIScore.create(10);
    if (!r.ok) throw new Error('expected ok');
    expect(r.data.isLowScore()).toBe(true);
  });

  it('treats boundary score 70 as high when isHighScore is checked', () => {
    const r = AIScore.create(70);
    if (!r.ok) throw new Error('expected ok');
    expect(r.data.isHighScore()).toBe(true);
    expect(r.data.isMediumScore()).toBe(false);
  });

  it('returns true from equals when two scores match exactly', () => {
    const a = AIScore.create(55);
    const b = AIScore.create(55);
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(true);
  });

  it('returns false from equals when scores differ', () => {
    const a = AIScore.create(55);
    const b = AIScore.create(56);
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.data.equals(b.data)).toBe(false);
  });

  it('accepts factory-generated aiScore when fed into create', () => {
    const lead = leadFactory({ aiScore: 73 });
    const r = AIScore.create(lead.aiScore);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.isHighScore()).toBe(true);
  });
});
