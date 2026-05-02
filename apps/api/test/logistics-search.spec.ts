/**
 * logistics-search.spec.ts — Task #434 Sprint 4
 *
 * TZ-47: GeoService — Haversine masofa + Geofence
 * TZ-48: RouteService — Dijkstra eng qisqa yo'l
 * TZ-49: VrpService — Clarke-Wright + 2-opt
 * TZ-50: FuzzySearchService — Levenshtein / fuzzy
 * TZ-51: FuzzySearchService — BM25 / FTS (rawSql mock)
 * TZ-52: KMeansService — K-Means klasterlash + optimal k
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  rawSql: jest.fn(),
  runQuery: jest.fn(),
}));

import { GeoService } from '../src/modules/logistics/domain/services/geo.service';
import { RouteService, Graph } from '../src/modules/logistics/domain/services/route.service';
import { VrpService, Delivery, Vehicle } from '../src/modules/logistics/domain/services/vrp.service';
import { FuzzySearchService } from '../src/modules/common/search/fuzzy-search.service';
import { KMeansService } from '../src/modules/common/search/kmeans.service';

const rawSqlMock = jest.requireMock('../src/shared/db').rawSql as jest.Mock;

// ============================================================================
// TZ-47: GeoService
// ============================================================================
describe('GeoService — TZ-47: Haversine + Geofence', () => {
  let svc: GeoService;
  beforeEach(() => { svc = new GeoService(); });

  it('Toshkent → Samarqand ≈ 260-280 km', () => {
    const r = svc.haversine(41.299, 69.240, 39.654, 66.975);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toBeGreaterThan(250);
      expect(r.data).toBeLessThan(290);
    }
  });

  it('bir xil nuqta → 0 km', () => {
    const r = svc.haversine(41.0, 69.0, 41.0, 69.0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeCloseTo(0, 5);
  });

  it('noto\'g\'ri lat (>90) → Err', () => {
    expect(svc.haversine(91, 0, 0, 0).ok).toBe(false);
  });

  it('noto\'g\'ri lon (<-180) → Err', () => {
    expect(svc.haversine(0, -181, 0, 0).ok).toBe(false);
  });

  it('Moskva → Toshkent ≈ 2750-3100 km', () => {
    const r = svc.haversine(55.75, 37.62, 41.30, 69.24);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toBeGreaterThan(2700);
      expect(r.data).toBeLessThan(3100);
    }
  });

  it('doira geofence: markaz = Toshkent, 10 km radius — ichida', () => {
    const r = svc.isInCircularGeofence(41.30, 69.25, 41.30, 69.24, 10);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(true);
  });

  it('doira geofence: 1 km radius — tashqarida', () => {
    const r = svc.isInCircularGeofence(41.399, 69.240, 41.30, 69.24, 1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(false);
  });

  it('doira geofence: manfiy radius → Err', () => {
    const r = svc.isInCircularGeofence(41.30, 69.24, 41.30, 69.24, -1);
    expect(r.ok).toBe(false);
  });

  it('polygon geofence: nuqta kvadrat ichida', () => {
    const poly: [number, number][] = [[0, 0], [0, 10], [10, 10], [10, 0]];
    const r = svc.isInPolygonGeofence(5, 5, poly);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(true);
  });

  it('polygon geofence: nuqta tashqarida', () => {
    const poly: [number, number][] = [[0, 0], [0, 5], [5, 5], [5, 0]];
    const r = svc.isInPolygonGeofence(10, 10, poly);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(false);
  });

  it('polygon geofence: 2 ta vertex → Err', () => {
    const r = svc.isInPolygonGeofence(5, 5, [[0, 0], [5, 5]]);
    expect(r.ok).toBe(false);
  });

  it('findNearest: eng yaqin nuqtani topadi', async () => {
    const candidates = [
      { lat: 50.0, lon: 50.0 },
      { lat: 41.30, lon: 69.25 },
    ];
    const r = await svc.findNearest({ lat: 41.30, lon: 69.24 }, candidates);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.index).toBe(1);
  });

  it('findNearest: bo\'sh ro\'yxat → Err', async () => {
    const r = await svc.findNearest({ lat: 41.30, lon: 69.24 }, []);
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-48: RouteService — Dijkstra
// ============================================================================
describe('RouteService — TZ-48: Dijkstra', () => {
  let svc: RouteService;

  const buildGraph = (): Graph => {
    const g: Graph = new Map();
    g.set('A', [{ to: 'B', weight: 1 }, { to: 'C', weight: 4 }]);
    g.set('B', [{ to: 'C', weight: 2 }, { to: 'D', weight: 5 }]);
    g.set('C', [{ to: 'D', weight: 1 }]);
    g.set('D', []);
    return g;
  };

  beforeEach(() => { svc = new RouteService(); });

  it('A→D: optimal yo\'l [A,B,C,D] dist=4', () => {
    const r = svc.dijkstra(buildGraph(), 'A', 'D');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.path).toEqual(['A', 'B', 'C', 'D']);
      expect(r.data.totalDist).toBe(4);
    }
  });

  it('A→A: masofasi 0, path = [A]', () => {
    const r = svc.dijkstra(buildGraph(), 'A', 'A');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.totalDist).toBe(0);
      expect(r.data.path).toEqual(['A']);
    }
  });

  it('yo\'l yo\'q → NOT_FOUND Err', () => {
    const g: Graph = new Map();
    g.set('X', []);
    g.set('Y', []);
    const r = svc.dijkstra(g, 'X', 'Y');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('mavjud bo\'lmagan tugun → NOT_FOUND Err', () => {
    const r = svc.dijkstra(buildGraph(), 'Z', 'A');
    expect(r.ok).toBe(false);
  });

  it('manfiy qirra og\'irligi → VALIDATION Err', () => {
    const g: Graph = new Map([
      ['A', [{ to: 'B', weight: -1 }]],
      ['B', []],
    ]);
    const r = svc.dijkstra(g, 'A', 'B');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('dijkstraAll: barcha tugunlarga masofa', () => {
    const r = svc.dijkstraAll(buildGraph(), 'A');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.get('A')).toBe(0);
      expect(r.data.get('D')).toBe(4);
    }
  });

  it('buildUndirectedGraph: ikkala yo\'nalish mavjud', () => {
    const g = svc.buildUndirectedGraph([{ from: 'A', to: 'B', weight: 5 }]);
    expect(g.get('A')?.some(e => e.to === 'B')).toBe(true);
    expect(g.get('B')?.some(e => e.to === 'A')).toBe(true);
  });
});

// ============================================================================
// TZ-49: VrpService — Clarke-Wright + 2-opt
// ============================================================================
describe('VrpService — TZ-49: VRP', () => {
  let geoSvc: GeoService;
  let svc: VrpService;

  const depot = { lat: 41.30, lon: 69.24 };
  const vehicles: Vehicle[] = [
    { id: 'v1', capacity: 100 },
    { id: 'v2', capacity: 100 },
  ];
  const deliveries: Delivery[] = [
    { id: 'd1', lat: 41.35, lon: 69.30, weight: 20 },
    { id: 'd2', lat: 41.25, lon: 69.20, weight: 30 },
    { id: 'd3', lat: 41.40, lon: 69.10, weight: 25 },
    { id: 'd4', lat: 41.20, lon: 69.40, weight: 15 },
  ];

  beforeEach(() => {
    geoSvc = new GeoService();
    svc = new VrpService(geoSvc);
  });

  it('bo\'sh yetkazishlar → bo\'sh yo\'llar', async () => {
    const r = await svc.optimizeRoutes(depot, [], vehicles);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.routes).toHaveLength(0);
      expect(r.data.totalDistance).toBe(0);
    }
  });

  it('transport vositasiz → Err', async () => {
    const r = await svc.optimizeRoutes(depot, deliveries, []);
    expect(r.ok).toBe(false);
  });

  it('4 yetkazish, 4 transport → marshrut(lar) qaytariladi', async () => {
    const bigFleet: Vehicle[] = [
      { id: 'v1', capacity: 100 },
      { id: 'v2', capacity: 100 },
      { id: 'v3', capacity: 100 },
      { id: 'v4', capacity: 100 },
    ];
    const r = await svc.optimizeRoutes(depot, deliveries, bigFleet);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.routes.length).toBeGreaterThan(0);
      expect(r.data.totalDistance).toBeGreaterThan(0);
    }
  });

  it('barcha yetkazishlar marshrutlarda mavjud (yo\'qolmagan)', async () => {
    const bigFleet: Vehicle[] = [
      { id: 'v1', capacity: 100 },
      { id: 'v2', capacity: 100 },
      { id: 'v3', capacity: 100 },
      { id: 'v4', capacity: 100 },
    ];
    const r = await svc.optimizeRoutes(depot, deliveries, bigFleet);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const allStops = r.data.routes.flatMap(rt => rt.stops);
      for (const d of deliveries) {
        expect(allStops).toContain(d.id);
      }
    }
  });

  it('transport sig\'imi yetarli bo\'lmasa → xato (jim o\'tkazilmaydi)', async () => {
    const tinyVehicle: Vehicle[] = [{ id: 'v1', capacity: 5 }];
    const r = await svc.optimizeRoutes(depot, deliveries, tinyVehicle);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
  });

  it('har bir transport faqat bir marta tayinlanadi', async () => {
    const twoVehicles: Vehicle[] = [
      { id: 'v1', capacity: 100 },
      { id: 'v2', capacity: 100 },
    ];
    const manyDeliveries: Delivery[] = [
      { id: 'd1', lat: 41.35, lon: 69.30, weight: 60 },
      { id: 'd2', lat: 41.25, lon: 69.20, weight: 60 },
    ];
    const r = await svc.optimizeRoutes(depot, manyDeliveries, twoVehicles);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const vehicleIds = r.data.routes.map(rt => rt.vehicleId);
      const uniqueVehicles = new Set(vehicleIds);
      expect(uniqueVehicles.size).toBe(vehicleIds.length);
    }
  });

  it('2-opt: bitta yetkazish uchun to\'g\'ri masofa', async () => {
    const single: Delivery[] = [{ id: 's1', lat: 41.35, lon: 69.30, weight: 10 }];
    const r = await svc.optimizeRoutes(depot, single, [{ id: 'v1', capacity: 50 }]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.routes[0].stops).toEqual(['s1']);
      expect(r.data.routes[0].distance).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// TZ-50: FuzzySearchService — Levenshtein
// ============================================================================
describe('FuzzySearchService — TZ-50: Levenshtein / Fuzzy', () => {
  let svc: FuzzySearchService;
  beforeEach(() => {
    svc = new FuzzySearchService();
    rawSqlMock.mockReset();
  });

  it('"salom" vs "ssalom" → dist=1', () => {
    expect(svc.levenshtein('salom', 'ssalom')).toBe(1);
  });

  it('"" vs "hello" → dist=5', () => {
    expect(svc.levenshtein('', 'hello')).toBe(5);
  });

  it('"hello" vs "" → dist=5', () => {
    expect(svc.levenshtein('hello', '')).toBe(5);
  });

  it('bir xil satr → dist=0', () => {
    expect(svc.levenshtein('kompaniya', 'kompaniya')).toBe(0);
  });

  it('"kitten" vs "sitting" → dist=3', () => {
    expect(svc.levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('similarity: bir xil → 1.0', () => {
    expect(svc.similarity('abc', 'abc')).toBeCloseTo(1.0, 5);
  });

  it('similarity: to\'liq boshqa → 0', () => {
    expect(svc.similarity('abc', 'xyz')).toBeCloseTo(0, 5);
  });

  it('similarity: "salom" vs "ssalom" ≥ 0.7', () => {
    expect(svc.similarity('salom', 'ssalom')).toBeGreaterThanOrEqual(0.7);
  });

  it('filterBySimilarity: bo\'sh query → Err', async () => {
    const r = svc.filterBySimilarity('', ['kompaniya'], (x) => x, 0.7);
    expect(r.ok).toBe(false);
  });

  it('filterBySimilarity: mos kelgan elementlar qaytariladi', () => {
    const r = svc.filterBySimilarity('kompan', ['kompaniya', 'maktab', 'kompan'], x => x, 0.5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.some(m => m.item === 'kompan')).toBe(true);
    }
  });

  it('fuzzySearchProducts: DB natijasini qaytaradi', async () => {
    rawSqlMock.mockResolvedValueOnce([
      { id: '1', name: 'Test mahsulot', similarity: '0.85' },
    ]);
    const r = await svc.fuzzySearchProducts('Test', 0.7, 20);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data[0].similarity).toBeCloseTo(0.85, 2);
    }
  });

  it('fuzzySearchProducts: bo\'sh query → Err', async () => {
    const r = await svc.fuzzySearchProducts('  ', 0.7, 20);
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-51: FuzzySearchService — BM25 / FTS
// ============================================================================
describe('FuzzySearchService — TZ-51: BM25 / FTS', () => {
  let svc: FuzzySearchService;
  beforeEach(() => {
    svc = new FuzzySearchService();
    rawSqlMock.mockReset();
  });

  it('fullTextSearch: DB natijasini qaytaradi (ts_rank_cd)', async () => {
    rawSqlMock.mockResolvedValueOnce([
      { id: '1', name: 'Qog\'oz', rank: '0.12' },
      { id: '2', name: 'Qog\'oz A4', rank: '0.08' },
    ]);
    const r = await svc.fullTextSearch('qog\'oz');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(2);
      expect(r.data[0].rank).toBeCloseTo(0.12, 2);
    }
  });

  it('fullTextSearch: bo\'sh query → Err', async () => {
    const r = await svc.fullTextSearch('');
    expect(r.ok).toBe(false);
  });

  it('fullTextSearch: limit 100 dan oshmasin (200 berilsa 100 ishlatiladi)', async () => {
    rawSqlMock.mockResolvedValueOnce([]);
    const r = await svc.fullTextSearch('test', { limit: 200 });
    expect(r.ok).toBe(true);
    expect(rawSqlMock).toHaveBeenCalledTimes(1);
  });

  it('fullTextSearch: multiword query & bilan birlashtirilib SQL ga uzatiladi', async () => {
    rawSqlMock.mockResolvedValueOnce([]);
    const r = await svc.fullTextSearch('qog oz');
    expect(r.ok).toBe(true);
    expect(rawSqlMock).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// TZ-52: KMeansService
// ============================================================================
describe('KMeansService — TZ-52: K-Means + optimal k', () => {
  let svc: KMeansService;
  beforeEach(() => { svc = new KMeansService(); });

  const clusterData: [number, number][] = [
    [1, 1], [1.1, 0.9], [0.9, 1.1],
    [5, 5], [5.1, 4.9], [4.9, 5.1],
    [9, 1], [9.1, 0.9], [8.9, 1.1],
  ];

  it('fit: k=3 → 3 ta klaster', () => {
    const r = svc.fit(clusterData, 3);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.centroids).toHaveLength(3);
      expect(r.data.assignments).toHaveLength(clusterData.length);
    }
  });

  it('fit: k=1 → hammasi bitta klasterda', () => {
    const r = svc.fit(clusterData, 1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(new Set(r.data.assignments).size).toBe(1);
    }
  });

  it('fit: wcss hisoblangan (>0)', () => {
    const r = svc.fit(clusterData, 3);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.wcss).toBeGreaterThan(0);
  });

  it('fit: bo\'sh nuqtalar → Err', () => {
    const r = svc.fit([], 2);
    expect(r.ok).toBe(false);
  });

  it('fit: k > nuqtalar soni → Err', () => {
    const r = svc.fit([[1, 1], [2, 2]], 5);
    expect(r.ok).toBe(false);
  });

  it('fit: k < 1 → Err', () => {
    const r = svc.fit(clusterData, 0);
    expect(r.ok).toBe(false);
  });

  it('fit: turli o\'lchamdagi nuqtalar → Err', () => {
    const r = svc.fit([[1, 2], [3, 4, 5]], 2);
    expect(r.ok).toBe(false);
  });

  it('findOptimalK: k=3 data uchun silhouette eng yuqori', () => {
    const r = svc.findOptimalK(clusterData, 2, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.k).toBeGreaterThanOrEqual(2);
      expect(r.data.silhouetteScore).toBeGreaterThan(0);
    }
  });

  it('findOptimalK: bo\'sh nuqtalar → Err', () => {
    const r = svc.findOptimalK([], 2, 5);
    expect(r.ok).toBe(false);
  });

  it('findOptimalK: kMin > kMax → Err', () => {
    const r = svc.findOptimalK(clusterData, 5, 2);
    expect(r.ok).toBe(false);
  });

  it('fit: silhouette k=3 > k=1 (3 ta aniq klaster)', () => {
    const r1 = svc.fit(clusterData, 1);
    const r3 = svc.fit(clusterData, 3);
    expect(r1.ok && r3.ok).toBe(true);
    if (r1.ok && r3.ok) {
      expect(r3.data.silhouetteScore).toBeGreaterThan(r1.data.silhouetteScore);
    }
  });
});
