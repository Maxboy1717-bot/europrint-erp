/**
 * @module hr-dashboard-stubs-common
 * @description Shared helpers + schema for the hr-dashboard-stubs controller siblings.
 * Extracted per Rule 16 (<= 300 lines).
 */

import { z } from 'zod';

export { notImplemented } from '@common/exceptions/not-implemented';

export const PassthroughSchema = z.record(z.unknown());
