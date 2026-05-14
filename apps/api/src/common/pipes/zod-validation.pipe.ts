/**
 * @module zod-validation.pipe
 * @description NestJS pipe. Transforms or validates the request payload before the handler runs.
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common'
import { ZodSchema, ZodError } from 'zod'

/**
 * §2 - Zod v3 bilan validatsiya pipe
 */

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    // Only validate body parameters — skip path params, query params, custom decorators
    if (metadata.type !== 'body') return value;
    try {
      const result = this.schema.parse(value)
      return result
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const formattedErrors = (Array.isArray(error?.errors) ? error?.errors : []).map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))

        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        })
      }

      throw error
    }
  }
}
