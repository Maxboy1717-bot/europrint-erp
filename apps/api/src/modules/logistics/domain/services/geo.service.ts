/**
 * geo.service.ts — TZ-47: Haversine Masofa + Geofence
 *
 * Haversine formula (sferik masofa):
 *   a = sin²(Δφ/2) + cosφ₁ × cosφ₂ × sin²(Δλ/2)
 *   c = 2 × atan2(√a, √(1−a))
 *   d = R × c  (R = 6371 km)
 *
 * TAQIQLANGAN: Euclidean masofa (shahar koordinatalarida noto'g'ri)
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
