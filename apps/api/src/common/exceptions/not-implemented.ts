/**
 * @module not-implemented
 * @description Shared helper for controllers that need to return HTTP 501
 * Not Implemented. Use this instead of `throw new HttpException(...)` in
 * every controller so feature-gated stubs share a single canonical
 * implementation and reduce duplication.
 *
 * Usage:
 * ```ts
 * import { notImplemented } from '@common/exceptions/not-implemented';
 *
 * @Get('something')
 * async doSomething() {
 *   return notImplemented('GET /something');
 * }
 * ```
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Throws an HTTP 501 with a canonical body shape:
 *   `{ message: 'Endpoint not yet implemented: <route>', code: 'NOT_IMPLEMENTED' }`
 *
 * Returns `never` so callers can `return notImplemented(...)` from a
 * non-void controller method without TS complaining about the unreachable
 * return type.
 */
export const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};
