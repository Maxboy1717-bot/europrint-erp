/**
 * @module geo.service
 * @description Geographic distance + geofence primitives for logistics.
 *   Implements the **Haversine formula** for great-circle distance between
 *   two lat/lon points on a sphere:
 *
 *     a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
 *     c = 2 × atan2(√a, √(1−a))
 *     d = R × c           where R = 6371 km (mean Earth radius)
 *
 *   Plus circular and polygon geofence checks for delivery-zone validation
 *   (e.g. "is this customer inside our Tashkent same-day-delivery area?").
 * @layer Domain Service (Logistics)
 *
 * WHY HAVERSINE, NOT EUCLIDEAN
 *   Latitude and longitude are angles on a sphere, not Cartesian coordinates.
 *   Euclidean distance √((lat₂−lat₁)² + (lon₂−lon₁)²) returns a value in
 *   "degrees", which is wrong AND non-linear: 1° of longitude is ~111 km at
 *   the equator but only ~80 km at Tashkent's latitude (~41°N). For
 *   delivery cost or ETA estimation that's a 30%+ error.
 *
 *   Haversine accounts for the cosine of latitude and returns km directly.
 *   It's the industry standard for "near enough" distance under 1000 km;
 *   beyond that, Vincenty's formula would be marginally more accurate but
 *   isn't needed for in-country delivery.
 *
 * WHY R = 6371 km (mean radius)
 *   Earth is an oblate spheroid (~6378 km equator, 6357 km poles). Mean
 *   radius gives error ~0.5% — acceptable for routing. Using the precise
 *   WGS-84 ellipsoid model would require Vincenty and isn't worth it.
 *
 * WHY VALIDATION ON COORDINATES
 *   Customer-data quality is poor — sometimes lat/lon get swapped, or
 *   imported as 0/0 (null island), or as raw GPS strings with no parsing.
 *   We reject anything outside [-90..90] / [-180..180] explicitly so the
 *   caller sees a VALIDATION error instead of a nonsense distance.
 *
 * WHY THIS LIVES IN LOGISTICS, NOT IN COMMON
 *   Other modules (camera attendance, HR room presence) DON'T need
 *   km-level accuracy — they're indoor proximity. Keeping this in logistics
 *   prevents "let's just use geo.haversine here" creep into wrong contexts.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { Calculation } from '@common/decorators/calculation.decorator';

export interface GeoPoint {
  lat: number;
  lon: number;
}

@Injectable()
export class GeoService {
  readonly EARTH_RADIUS_KM = 6371;

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private isValidCoord(lat: number, lon: number): boolean {
    return (
      isFinite(lat) && isFinite(lon) &&
      lat >= -90 && lat <= 90 &&
      lon >= -180 && lon <= 180
    );
  }

  /**
   * Haversine formulasi bo'yicha ikkita nuqta orasidagi masofa (km).
   * Koordinatalar radianslarga to'g'ri o'tkaziladi.
   * Sinxron — sof hisoblash.
   */
  haversine(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Result<number, AppError> {
    if (!this.isValidCoord(lat1, lon1) || !this.isValidCoord(lat2, lon2)) {
      return Err({ code: 'VALIDATION', message: 'Koordinata noto\'g\'ri: lat [-90,90], lon [-180,180]' });
    }

    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const φ1   = this.toRad(lat1);
    const φ2   = this.toRad(lat2);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Ok(this.EARTH_RADIUS_KM * c);
  }

  /**
   * Haversine: ikki GeoPoint orasidagi masofa.
   */
  distanceBetween(a: GeoPoint, b: GeoPoint): Result<number, AppError> {
    return this.haversine(a.lat, a.lon, b.lat, b.lon);
  }

  /**
   * Doira geofence: nuqta radius doirasida ekanligini tekshirish.
   */
  isInCircularGeofence(
    pointLat: number,
    pointLon: number,
    centerLat: number,
    centerLon: number,
    radiusKm: number,
  ): Result<boolean, AppError> {
    if (radiusKm < 0) {
      return Err({ code: 'VALIDATION', message: 'radius musbat bo\'lishi kerak' });
    }
    const dist = this.haversine(pointLat, pointLon, centerLat, centerLon);
    if (!dist.ok) return dist as Result<boolean, AppError>;
    return Ok(dist.data <= radiusKm);
  }

  /**
   * Ko'pburchak geofence: ray casting algoritmi.
   * polygonVertices: [[lat, lon], ...]
   */
  isInPolygonGeofence(
    pointLat: number,
    pointLon: number,
    polygonVertices: readonly [number, number][],
  ): Result<boolean, AppError> {
    if (!this.isValidCoord(pointLat, pointLon)) {
      return Err({ code: 'VALIDATION', message: 'Koordinata noto\'g\'ri' });
    }
    if (polygonVertices.length < 3) {
      return Err({ code: 'VALIDATION', message: 'Polygon kamida 3 ta vertex kerak' });
    }

    let inside = false;
    const n = polygonVertices.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = polygonVertices[i];
      const [xj, yj] = polygonVertices[j];

      const intersects =
        yi > pointLon !== yj > pointLon &&
        pointLat < ((xj - xi) * (pointLon - yi)) / (yj - yi) + xi;

      if (intersects) inside = !inside;
    }

    return Ok(inside);
  }

  /**
   * Ko'p nuqtalar orasidan eng yaqinini topish.
   */
  @Calculation('logistics.geo.nearest')
  async findNearest(
    origin: GeoPoint,
    candidates: readonly GeoPoint[],
  ): Promise<Result<{ index: number; point: GeoPoint; distKm: number }, AppError>> {
    if (!candidates.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Kandidatlar ro\'yxati bo\'sh' });
    }

    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const d = this.haversine(origin.lat, origin.lon, candidates[i].lat, candidates[i].lon);
      if (!d.ok) continue;
      if (d.data < bestDist) {
        bestDist = d.data;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) {
      return Err({ code: 'INTERNAL', message: 'Eng yaqin nuqta hisoblab bo\'lmadi' });
    }

    return Ok({ index: bestIdx, point: candidates[bestIdx], distKm: bestDist });
  }
}
