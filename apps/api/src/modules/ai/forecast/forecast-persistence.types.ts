/**
 * @module forecast-persistence.types
 * @description Shared types for forecast persistence (service + repository).
 *   Extracted to break the cyclic dependency.
 * @layer Types (AI/forecast)
 */

import type { ErrorMetrics } from './forecast.service';

export interface ForecastRecord {
  materialId: string;
  period: Date;
  forecastQty: number;
  method: 'EMA' | 'HW' | 'LINEAR' | 'CROSTON' | 'ENSEMBLE';
  actualQty?: number;
  alpha?: number;
  metrics?: ErrorMetrics;
}
