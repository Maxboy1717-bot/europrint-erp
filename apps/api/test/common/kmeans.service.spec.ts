/**
 * Smoke spec for KMeansService (Rule 22: every service needs a unit test).
 */
import { KMeansService } from '../../src/modules/common/search/kmeans.service';

describe('KMeansService', () => {
  let svc: KMeansService;

  beforeEach(() => {
    svc = new KMeansService();
  });

  it('class is defined and constructible', () => {
    expect(KMeansService).toBeDefined();
    expect(svc).toBeInstanceOf(KMeansService);
  });

  it('fit returns BAD_REQUEST for empty points list', () => {
    const res = svc.fit([], 2);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('BAD_REQUEST');
  });

  it('fit returns BAD_REQUEST when k > number of points', () => {
    const res = svc.fit([[0, 0], [1, 1]], 5);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('BAD_REQUEST');
  });

  it('fit converges on clearly separated 2-D clusters with k=2', () => {
    const points: number[][] = [
      [0, 0], [0, 1], [1, 0], [1, 1],
      [10, 10], [10, 11], [11, 10], [11, 11],
    ];
    const res = svc.fit(points, 2, 50, 7);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.k).toBe(2);
      expect(res.data.assignments).toHaveLength(points.length);
      expect(res.data.centroids).toHaveLength(2);
    }
  });

  it('silhouette of single cluster (k=1) returns 0', () => {
    expect(svc.silhouette([[0, 0], [1, 1]], [0, 0], 1)).toBe(0);
  });
});
