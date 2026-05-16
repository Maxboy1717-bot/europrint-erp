/**
 * Smoke spec for FuzzySearchService (Rule 22: every service needs a unit test).
 *
 * Covers pure functions: levenshtein, similarity, filterBySimilarity.
 * No DB access needed for these computations.
 */
jest.mock('../../src/shared/db', () => ({
  db:       {},
  rawSql:   jest.fn().mockResolvedValue({ rows: [] }),
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { FuzzySearchService } from '../../src/modules/common/search/fuzzy-search.service';

describe('FuzzySearchService', () => {
  let svc: FuzzySearchService;

  beforeEach(() => {
    svc = new FuzzySearchService();
  });

  it('class is defined and constructible', () => {
    expect(FuzzySearchService).toBeDefined();
    expect(svc).toBeInstanceOf(FuzzySearchService);
  });

  it('levenshtein returns 0 for identical strings', () => {
    expect(svc.levenshtein('hello', 'hello')).toBe(0);
  });

  it('levenshtein is symmetric for non-trivial cases', () => {
    expect(svc.levenshtein('kitten', 'sitting')).toBe(svc.levenshtein('sitting', 'kitten'));
    expect(svc.levenshtein('kitten', 'sitting')).toBeGreaterThan(0);
  });

  it('similarity returns 1 for equal strings and < 1 for different ones', () => {
    expect(svc.similarity('abc', 'abc')).toBe(1);
    expect(svc.similarity('abc', 'xyz')).toBeLessThan(1);
  });

  it('filterBySimilarity returns VALIDATION error for empty query', () => {
    const res = svc.filterBySimilarity('   ', [{ name: 'a' }], (i) => i.name, 0.5);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });
});
