/**
 * @module internal-secret
 * @description Source module. See exports for details.
 */

import { ForbiddenException } from '@nestjs/common';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

export function requireInternalSecret(secret: string | undefined): void {
  const valid = Boolean(INTERNAL_SECRET) && !!secret && secret === INTERNAL_SECRET;
  if (!valid) throw new ForbiddenException('Missing or invalid X-Internal-Secret header');
}
