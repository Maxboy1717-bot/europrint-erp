import { Injectable, Logger } from '@nestjs/common';
import { safeDiv } from '@common/math/math-utils';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import {
  AGENT_CODES, AI_GEMINI_MODEL,
  EARTH_RADIUS_M, DEFAULT_SPEED_KMH, VRP_MAX_ITERATIONS,
} from '../common/ai-agents.constants';

export interface Customer { id: string; lat: number; lng: number; demand: number; }
export interface Truck    { id: string; capacity: number; }
export interface Stop     { customerId: string; lat: number; lng: number; etaMin: number; etaIso: string; }
export interface RoutePlan { truckId: string; stops: Stop[]; distanceM: number; durationMin: number; }
export interface RouteVariant { strategy: 'distance' | 'time' | 'balanced'; plans: RoutePlan[]; totalDistanceM: number; maxEtaMin: number; }

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);

  constructor(private readonly logSvc: AiDecisionLogService) {}

  haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat  = toRad(lat2 - lat1);
    const dLng  = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
  }

  private twoOptRoute(stops: Customer[], depot: Customer): Customer[] {
    let best    = [...stops];
    let improved = true;
    let iters    = 0;

    while (improved && iters < VRP_MAX_ITERATIONS) {
      improved = false;
      iters++;
      for (let i = 0; i < best.length - 1; i++) {
        for (let j = i + 1; j < best.length; j++) {
          const newRoute = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
          if (this.routeDistance(newRoute, depot) < this.routeDistance(best, depot)) {
            best     = newRoute;
            improved = true;
          }
        }
      }
    }
    return best;
  }

  private routeDistance(stops: Customer[], depot: Customer): number {
    if (stops.length === 0) return 0;
    let dist = this.haversine(depot.lat, depot.lng, stops[0].lat, stops[0].lng);
    for (let i = 0; i < stops.length - 1; i++) {
      dist += this.haversine(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
    }
    dist += this.haversine(stops[stops.length - 1].lat, stops[stops.length - 1].lng, depot.lat, depot.lng);
    return dist;
  }

  /**
   * Builds route plans for a given customer-to-truck assignment using Clarke-Wright
   * savings + 2-opt local improvement, dispatching from `depot` at `dispatchTime`.
   *
   * `strategy` controls how customers are clustered across trucks:
   * - 'distance' : standard Clarke-Wright savings (minimise total distance)
   * - 'time'     : sort by angular proximity to depot first (minimise max ETA)
   * - 'balanced' : round-robin assignment across trucks (even load distribution)
   */
  private buildPlans(
    strategy:     'distance' | 'time' | 'balanced',
    customers:    Customer[],
    trucks:       Truck[],
    depot:        { lat: number; lng: number },
    dispatchTime: Date,
  ): RoutePlan[] {
    const depotNode = { id: 'depot', lat: depot.lat, lng: depot.lng, demand: 0 };

    if (trucks.length === 0 || customers.length === 0) return [];

    let routeBuckets: Customer[][];

    if (strategy === 'balanced') {
      routeBuckets = trucks.map(() => [] as Customer[]);
      customers.forEach((c, idx) => routeBuckets[idx % trucks.length].push(c));
      routeBuckets = routeBuckets.filter((b) => b.length > 0);
    } else if (strategy === 'time') {
      const angle = (c: Customer) => Math.atan2(c.lat - depot.lat, c.lng - depot.lng);
      const sorted = [...customers].sort((a, b) => angle(a) - angle(b));
      const chunkSize = Math.ceil(sorted.length / trucks.length);
      routeBuckets = [];
      for (let i = 0; i < sorted.length; i += chunkSize) {
        routeBuckets.push(sorted.slice(i, i + chunkSize));
      }
    } else {
      const savings: { i: number; j: number; saving: number }[] = [];
      for (let i = 0; i < customers.length; i++) {
        for (let j = i + 1; j < customers.length; j++) {
          const s = this.haversine(depot.lat, depot.lng, customers[i].lat, customers[i].lng)
                  + this.haversine(depot.lat, depot.lng, customers[j].lat, customers[j].lng)
                  - this.haversine(customers[i].lat, customers[i].lng, customers[j].lat, customers[j].lng);
          savings.push({ i, j, saving: s });
        }
      }
      savings.sort((a, b) => b.saving - a.saving);

      const routes: Customer[][] = customers.map((c) => [c]);
      const assignment = new Map<string, number>(customers.map((c, i) => [c.id, i]));
      const routeTruck = new Map<number, Truck>();

      for (const { i, j } of savings) {
        const ri = assignment.get(customers[i].id) ?? -1;
        const rj = assignment.get(customers[j].id) ?? -1;
        if (ri === rj || ri < 0 || rj < 0) continue;
        const merged      = [...routes[ri], ...routes[rj]];
        const totalDemand = merged.reduce((s, c) => s + c.demand, 0);
        const usedIds     = new Set([...routeTruck.values()].map((t) => t.id));
        const truck       = trucks.find((t) => t.capacity >= totalDemand && !usedIds.has(t.id));
        if (!truck) continue;
        routes[ri] = merged;
        routes[rj] = [];
        routeTruck.delete(rj);
        routeTruck.set(ri, truck);
        for (const c of merged) assignment.set(c.id, ri);
      }

      routeBuckets = routes
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => r.length > 0)
        .map(({ r }) => r);
    }

    const usedTruckIds = new Set<string>();
    const plans: RoutePlan[] = [];

    for (const bucket of routeBuckets) {
      const routeDemand = bucket.reduce((s, c) => s + c.demand, 0);
      const truck       = trucks.find((t) => t.capacity >= routeDemand && !usedTruckIds.has(t.id));
      if (!truck) {
        this.logger.warn({ msg: `No available truck for strategy=${strategy}`, routeDemand });
        continue;
      }
      usedTruckIds.add(truck.id);

      const optimized   = this.twoOptRoute(bucket, depotNode);
      const distanceM   = this.routeDistance(optimized, depotNode);
      const durationMin = safeDiv(distanceM, DEFAULT_SPEED_KMH * 1000 / 60);

      let elapsed  = 0;
      let prevLat  = depot.lat;
      let prevLng  = depot.lng;
      const dispatchMs = dispatchTime.getTime();

      const stops: Stop[] = optimized.map((c) => {
        const leg  = this.haversine(prevLat, prevLng, c.lat, c.lng);
        elapsed   += safeDiv(leg, DEFAULT_SPEED_KMH * 1000 / 60);
        prevLat    = c.lat;
        prevLng    = c.lng;
        const absEtaMs = dispatchMs + Math.round(elapsed) * 60_000;
        return { customerId: c.id, lat: c.lat, lng: c.lng, etaMin: Math.round(elapsed), etaIso: new Date(absEtaMs).toISOString() };
      });

      plans.push({ truckId: truck.id, stops, distanceM: Math.round(distanceM), durationMin: Math.round(durationMin) });
    }

    return plans;
  }

  async optimize(
    requestId:    string,
    depot:        { lat: number; lng: number },
    customers:    Customer[],
    trucks:       Truck[],
    dispatchTime: Date,
  ): Promise<RoutePlan[]> {
    const start          = Date.now();
    const canonicalInput = {
      requestId,
      customerIds: customers.map((c) => c.id).sort(),
      truckIds:    trucks.map((t) => t.id).sort(),
    };
    const inputHash      = this.logSvc.hashInput(canonicalInput);

    const cached = await this.logSvc.findCachedDecision(AGENT_CODES.ROUTER, inputHash).catch((err: unknown) => {
      this.logger.warn({ msg: 'VRP cache lookup failed; computing fresh', requestId, err });
      return null;
    });
    if (cached) {
      const stored = cached.alternatives[0] as { strategy: string; plans: RoutePlan[] } | undefined;
      if (stored?.plans) {
        this.logger.log({ msg: 'VRP: returning cached route plan', requestId, strategy: stored.strategy });
        return stored.plans;
      }
      this.logger.log({ msg: 'VRP: cache hit — recomputing (no stored plans)', requestId });
    }

    if (trucks.length === 0) {
      this.logger.warn({ msg: 'No trucks provided — returning empty plan', requestId });
      return [];
    }

    const strategies: Array<'distance' | 'time' | 'balanced'> = ['distance', 'time', 'balanced'];
    const variants: RouteVariant[] = strategies.map((strategy) => {
      const plans       = this.buildPlans(strategy, customers, trucks, depot, dispatchTime);
      const totalDistM  = plans.reduce((s, p) => s + p.distanceM, 0);
      const maxEtaMin   = plans.reduce((mx, p) => {
        const routeMax = p.stops.reduce((m, st) => Math.max(m, st.etaMin), 0);
        return Math.max(mx, routeMax);
      }, 0);
      return { strategy, plans, totalDistanceM: totalDistM, maxEtaMin };
    });

    const best      = variants.reduce((a, b) => a.totalDistanceM <= b.totalDistanceM ? a : b);
    const confidence = best.plans.length > 0 ? 0.88 : 0.5;

    await this.logSvc.log({
      agentCode:    AGENT_CODES.ROUTER,
      entityType:   'delivery_batch',
      entityId:     requestId,
      inputData:    canonicalInput,
      decision:     { action: 'route_optimized', confidence, alternatives: variants },
      confidence,
      modelVersion: AI_GEMINI_MODEL,
      autoExecuted: true,
      latencyMs:    Date.now() - start,
    });

    return best.plans;
  }
}
