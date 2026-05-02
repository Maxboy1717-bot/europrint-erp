/**
 * vrp.service.ts — TZ-49: VRP (Clarke-Wright Savings + 2-opt)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { Calculation } from '@common/decorators/calculation.decorator';
import { GeoService, GeoPoint } from './geo.service';

export interface Delivery {
  id: string;
  lat: number;
  lon: number;
  weight: number;
}

export interface Vehicle {
  id: string;
  capacity: number;
}

export interface VrpRoute {
  vehicleId: string;
  stops: string[];
  distance: number;
  load: number;
}

export interface VrpSolution {
  routes: VrpRoute[];
  totalDistance: number;
}

@Injectable()
export class VrpService {
  constructor(private readonly geoSvc: GeoService) {}

  private distBetween(a: GeoPoint, b: GeoPoint): number {
    const r = this.geoSvc.haversine(a.lat, a.lon, b.lat, b.lon);
    return r.ok ? r.data : 999999;
  }

  private routeDistance(
    stops: readonly string[],
    deliveryMap: Map<string, Delivery>,
    depot: GeoPoint,
  ): number {
    if (!stops.length) return 0;
    const pt = (id: string): GeoPoint => {
      const d = deliveryMap.get(id);
      if (!d) throw new Error(`VRP invariant: delivery ${id} not in deliveryMap`);
      return d;
    };
    let d = this.distBetween(depot, pt(stops[0]));
    for (let i = 0; i < stops.length - 1; i++) {
      d += this.distBetween(pt(stops[i]), pt(stops[i + 1]));
    }
    d += this.distBetween(pt(stops[stops.length - 1]), depot);
    return d;
  }

  private twoOpt(
    stops: string[],
    deliveryMap: Map<string, Delivery>,
    depot: GeoPoint,
    maxIter = 500,
  ): { stops: string[]; distance: number } {
    let best = [...stops];
    let bestDist = this.routeDistance(best, deliveryMap, depot);
    let improved = true;
    let iter = 0;

    while (improved && iter < maxIter) {
      improved = false;
      iter++;

      for (let i = 0; i < best.length - 1; i++) {
        for (let j = i + 2; j < best.length; j++) {
          const candidate = [
            ...best.slice(0, i + 1),
            ...best.slice(i + 1, j + 1).reverse(),
            ...best.slice(j + 1),
          ];
          const candidateDist = this.routeDistance(candidate, deliveryMap, depot);
          if (candidateDist < bestDist - 1e-9) {
            best = candidate;
            bestDist = candidateDist;
            improved = true;
          }
        }
      }
    }

    return { stops: best, distance: bestDist };
  }

  private findRouteKey(
    routeMap: Map<string, { stops: string[]; load: number }>,
    stopId: string,
  ): string | undefined {
    for (const [key, route] of routeMap.entries()) {
      if (route.stops.includes(stopId)) return key;
    }
    return;
  }

  @Calculation('logistics.vrp.clarkeWright')
  async optimizeRoutes(
    depot: GeoPoint,
    deliveries: readonly Delivery[],
    vehicles: readonly Vehicle[],
  ): Promise<Result<VrpSolution, AppError>> {
    if (!deliveries.length) return Ok({ routes: [], totalDistance: 0 });
    if (!vehicles.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Kamida bitta transport vositasi kerak' });
    }

    try {
    const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
    const deliveryMap = new Map<string, Delivery>((safeDeliveries ?? []).map(d => [d.id, d]));

    const d0 = new Map<string, number>(
      (safeDeliveries ?? []).map(d => [d.id, this.distBetween(depot, d)]),
    );

    const savings: { i: string; j: string; saving: number }[] = [];
    for (let a = 0; a < safeDeliveries.length; a++) {
      for (let b = a + 1; b < safeDeliveries.length; b++) {
        const da = safeDeliveries[a];
        const db = safeDeliveries[b];
        const dij = this.distBetween(da, db);
        const saving = (d0.get(da.id) ?? 0) + (d0.get(db.id) ?? 0) - dij;
        savings.push({ i: da.id, j: db.id, saving });
      }
    }
    savings.sort((a, b) => b.saving - a.saving);

    const routeMap = new Map<string, { stops: string[]; load: number }>();
    for (const d of safeDeliveries) {
      routeMap.set(d.id, { stops: [d.id], load: d.weight });
    }

    for (const { i, j, saving } of savings) {
      if (saving <= 0) break;

      const ki = this.findRouteKey(routeMap, i);
      const kj = this.findRouteKey(routeMap, j);
      if (!ki || !kj || ki === kj) continue;

      const ri = routeMap.get(ki);
      const rj = routeMap.get(kj);
      if (!ri || !rj) continue;
      const combinedLoad = ri.load + rj.load;

      const canCarry = (Array.isArray(vehicles) ? vehicles : []).some(v => v.capacity >= combinedLoad);
      if (!canCarry) continue;

      routeMap.delete(kj);
      routeMap.set(ki, {
        stops: [...ri.stops, ...rj.stops],
        load: combinedLoad,
      });
    }

    const availableVehicles = [...vehicles];
    const routes: VrpRoute[] = [];
    const unassignedStops: string[] = [];

    for (const [, route] of routeMap.entries()) {
      const vIdx = (Array.isArray(availableVehicles) ? availableVehicles : []).findIndex(v => v.capacity >= route.load);

      if (vIdx < 0) {
        unassignedStops.push(...route.stops);
        continue;
      }

      const vehicle = availableVehicles.splice(vIdx, 1)[0];
      const optimized = this.twoOpt(route.stops, deliveryMap, depot);
      routes.push({
        vehicleId: vehicle.id,
        stops: optimized.stops,
        distance: optimized.distance,
        load: route.load,
      });
    }

    if (unassignedStops.length > 0) {
      return Err({
        code: 'BAD_REQUEST',
        message: `${unassignedStops.length} ta yetkazish tayinlab bo\'lmadi: ${unassignedStops.join(', ')}. Qo\'shimcha transport vositasi yoki katta sig\'im kerak.`,
      });
    }

    const totalDistance = (Array.isArray(routes) ? routes : []).reduce((s, r) => s + r.distance, 0);
    return Ok({ routes, totalDistance });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Err({ code: 'INTERNAL', message });
    }
  }
}
