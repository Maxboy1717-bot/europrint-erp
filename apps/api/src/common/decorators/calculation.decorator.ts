/**
 * @module calculation.decorator
 * @description Observability wrapper for "calculation" methods — the
 *   business-math services like EOQ, MRP, RFM, OEE that drive dashboards.
 *   Applied as `@Calculation('domain.operation')` above any async method
 *   that performs a non-trivial compute. Emits two Prometheus signals:
 *
 *     europrint_calc_duration_seconds  (Histogram with finely-bucketed labels)
 *     europrint_calc_errors_total      (Counter, labelled by error class)
 *
 *   Used by Grafana for "calculation health" panels: p95 latency, error
 *   rate, throughput per operation. Target SLOs encoded in the bucket
 *   boundaries: p95 ≤ 500 ms, error rate ≤ 1%.
 * @layer Decorator (cross-cutting)
 *
 * WHY A DECORATOR INSTEAD OF MANUAL INSTRUMENTATION
 *   Every calculation method needs the same boilerplate: start timer,
 *   await result, stop timer, increment counter on error. Writing this
 *   per-method is repetitive AND error-prone (developer forgets to stop
 *   the timer in the error path → memory leak). The decorator captures
 *   the pattern in one place; applying `@Calculation('name')` is a
 *   single annotation.
 *
 * WHY THE METRIC SINGLETONS USE `register.getSingleMetric`
 *   In tests, the module is imported repeatedly; `new Histogram(...)`
 *   would throw "metric already registered". `getSingleMetric` returns
 *   the existing instance if any. The `??` fallback constructs on first
 *   use; subsequent calls reuse the same instance.
 *
 * WHY THE BUCKETS GO 1ms → 5s (and not uniform)
 *   We want fine resolution at the SLO boundary (~500ms) and rough
 *   resolution beyond. Log-ish spacing 1/5/10/25/50/100/250/500ms then
 *   1/2.5/5s matches Prometheus conventions for latency histograms.
 *
 * WHY ERRORS ARE RE-THROWN AFTER LOGGING
 *   The decorator is observability-only; it must not swallow exceptions
 *   or the caller's Result<T> contract breaks. We log + count, then
 *   `throw err` so the original handler runs unchanged.
 *
 * WHY THE LOGGER ACCESS IS DEFENSIVE (`if (logger && ...)`)
 *   Not every class injects a `logger` field. We optionally call it if
 *   present rather than requiring an interface; this keeps the decorator
 *   usable on standalone helper classes too.
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
