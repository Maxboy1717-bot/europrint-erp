/**
 * @Calculation('name') — TZ-D17: Hisob-kitob metodlari uchun observability dekoratoru.
 *
 * Nima qiladi:
 *   - Prometheus histogram: europrint_calc_duration_seconds
 *   - Prometheus counter:   europrint_calc_errors_total
 *   - Xato → counter increment + logger + qaytadan tashlaydi
 *
 * Ishlatish:
 *   @Calculation('eoq-calculate')
 *   async calculate(materialId: number): Promise<Result<EoqResult, AppError>> { ... }
 *
 * Prometheus (p95 maqsad < 500ms, error_rate < 1%):
 *   europrint_calc_duration_seconds_bucket{name, status}
 *   europrint_calc_errors_total{name, error_class}
 */
import { Histogram, Counter, register } from 'prom-client';

const CALC_BUCKETS = [0.001, 0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500, 1.000, 2.500, 5.000];

let _duration: Histogram<'name' | 'status'> | undefined;
let _errors: Counter<'name' | 'error_class'> | undefined;

function ensureMetrics(): {
  dur: Histogram<'name' | 'status'>;
  errs: Counter<'name' | 'error_class'>;
} {
  if (!_duration) {
    const existing = register.getSingleMetric('europrint_calc_duration_seconds');
    _duration = (existing as Histogram<'name' | 'status'> | undefined) ??
      new Histogram<'name' | 'status'>({
        name: 'europrint_calc_duration_seconds',
        help: 'EuroPrint business calculation duration (seconds)',
        labelNames: ['name', 'status'],
        buckets: CALC_BUCKETS,
      });
  }
  if (!_errors) {
    const existing = register.getSingleMetric('europrint_calc_errors_total');
    _errors = (existing as Counter<'name' | 'error_class'> | undefined) ??
      new Counter<'name' | 'error_class'>({
        name: 'europrint_calc_errors_total',
        help: 'EuroPrint calculation error count',
        labelNames: ['name', 'error_class'],
      });
  }
  return { dur: _duration, errs: _errors };
}

export function Calculation(name: string): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function (...args: unknown[]) {
      const label = name || String(propertyKey);
      const { dur, errs } = ensureMetrics();
      const endTimer = dur.startTimer({ name: label });

      try {
        const result = await originalMethod.apply(this, args);
        endTimer({ status: 'ok' });
        return result;
      } catch (err) {
        endTimer({ status: 'error' });
        const errorClass = err instanceof Error ? err.constructor.name : 'UnknownError';
        errs.inc({ name: label, error_class: errorClass });
        const logger = (this as Record<string, unknown>)['logger'];
        if (logger && typeof (logger as Record<string, unknown>)['error'] === 'function') {
          (logger as { error(msg: string): void }).error(
            `[Calculation] ${label} ✗ ${errorClass}`,
          );
        }
        throw err;
      }
    };

    return descriptor;
  };
}
