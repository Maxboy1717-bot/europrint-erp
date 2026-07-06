/**
 * @module parse-or-throw.util
 * @description Source module. See exports for details.
 */

import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
  message: string,
): z.output<S> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException(message);
  }
  return parsed.data as z.output<S>;
}
