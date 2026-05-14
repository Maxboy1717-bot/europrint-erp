/**
 * @module public.decorator
 * @description Method-level decorator that marks a route as unauthenticated.
 * The JwtAuthGuard reads this metadata key (`isPublic`) and short-circuits to
 * allow the request without a Bearer token.
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Marks a controller method (or whole class) as not requiring authentication.
 * Use sparingly — every `@Public()` route is an attack-surface decision.
 * @example
 *   @Public()
 *   @Get('health')
 *   health() { return { status: 'ok' }; }
 */
export const Public = () => SetMetadata('isPublic', true);
// NOTE: the matching metadata-key constant `IS_PUBLIC_KEY` is exported from
// `@common/decorators/public.decorator` — that file is what JwtAuthGuard reads.
