/**
 * @module throttle-profiles
 * @description Named `@Throttle()` profile decorators so controllers do not
 *              repeat the literal rate-limit configuration on every endpoint.
 *
 * Rationale: a grep across `apps/api/src/modules/.../*controller.ts` shows
 *   - 268 endpoints using `{ default: { limit: 100, ttl: 60_000 } }`
 *   -  16 endpoints using `{ ai:      { limit:  20, ttl: 60_000 } }`
 *   -   2 endpoints using `{ default: { limit:   5, ttl: 60_000 } }` (login)
 *   -   a long tail of one-off rates (10, 20, 50, 60, 120, 200, 300 / minute)
 *
 * The profile decorators below name the common patterns. Edge cases that
 * legitimately need a one-off rate (e.g. webhook bursts, IoT firehoses) can
 * still use the raw `@Throttle({...})` decorator directly.
 */

import { Throttle } from '@nestjs/throttler';

/**
 * Standard authenticated API endpoint: 100 requests / minute.
 * Covers the vast majority of CRUD controllers.
 */
export const ApiThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { limit: 100, ttl: 60_000 } });

/**
 * Authentication endpoints (login, refresh, password reset): 5 / minute.
 * Tightly rate-limited to slow down credential-stuffing and enumeration.
 */
export const AuthThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { limit: 5, ttl: 60_000 } });

/**
 * Public (un-authenticated) endpoints: 30 / minute.
 * Slightly tighter than `ApiThrottle` because there is no user identity to
 * attribute abuse to.
 */
export const PublicThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { limit: 30, ttl: 60_000 } });

/**
 * Chat / messaging endpoints: 60 / minute.
 * Allows roughly one message per second in steady state.
 */
export const ChatThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { limit: 60, ttl: 60_000 } });

/**
 * AI / LLM endpoints: 20 / minute on the dedicated `ai` throttler profile.
 * Configured separately from `default` so AI traffic does not starve the
 * regular request budget (and vice versa).
 */
export const AiThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ ai: { limit: 20, ttl: 60_000 } });
