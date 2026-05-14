/**
 * @module assertions
 * @description Source module. See exports for details.
 */

import { BadRequestException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ZodSchema, infer as ZodInfer } from 'zod';

export function assertFound<T>(data: T | null | undefined, message: string): asserts data is NonNullable<T> {
  if (data === null || data === undefined) throw new NotFoundException(message);
  if (Array.isArray(data) && data.length === 0) throw new NotFoundException(message);
}

export function assertRequired<T>(value: T | null | undefined | false | '', message: string): asserts value is NonNullable<T> {
  if (!value) throw new BadRequestException(message);
}

export function assertAnyRequired(values: unknown[], message: string): void {
  if (!(Array.isArray(values) ? values : []).some(Boolean)) throw new BadRequestException(message);
}

export function assertPositiveNumber(value: unknown, message: string): number {
  const n = parseFloat(String(value));
  if (isNaN(n) || n <= 0) throw new BadRequestException(message);
  return n;
}

export function assertAuth<T>(value: T | null | undefined | false | '', message: string): asserts value is T {
  if (!value) throw new UnauthorizedException(message);
}

export function assertInternal<T>(value: T | null | undefined | false | '', message: string): asserts value is NonNullable<T> {
  if (!value) throw new InternalServerErrorException(message);
}

export function assertValidated(success: boolean, message: string): void {
  if (!success) throw new BadRequestException(message);
}

export function assertDefined<T>(value: T | undefined, message: string): asserts value is T {
  if (value === undefined) throw new BadRequestException(message);
}

export function parseSafe<T extends ZodSchema>(
  schema: T,
  data: unknown,
  message = "Noto'g'ri ma'lumot",
): ZodInfer<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw new BadRequestException(message);
  return r.data;
}
