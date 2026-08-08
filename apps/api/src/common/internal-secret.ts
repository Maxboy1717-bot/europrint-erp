/**
 * @module internal-secret
 * @description Source module. See exports for details.
 */

import { ForbiddenException } from '@nestjs/common';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

/**
 * @param message Optional pre-translated message (caller should pass
 * `await this.i18n.t('errors.internalSecretMissingOrInvalid')` when i18n is
 * available in its DI context — this is a plain function, not a Nest
 * injectable, so it cannot resolve I18nService itself).
 */
export function requireInternalSecret(secret: string | undefined, message?: string): void {
  const valid = Boolean(INTERNAL_SECRET) && !!secret && secret === INTERNAL_SECRET;
  if (!valid) throw new ForbiddenException(message ?? 'Missing or invalid X-Internal-Secret header');
}
