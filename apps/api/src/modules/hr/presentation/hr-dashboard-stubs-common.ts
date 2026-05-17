/**
 * @module hr-dashboard-stubs-common
 * @description Shared helpers + schema for the hr-dashboard-stubs controller siblings.
 * Extracted per Rule 16 (≤ 300 lines).
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { z } from 'zod';

export const PassthroughSchema = z.record(z.unknown());

export const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};
