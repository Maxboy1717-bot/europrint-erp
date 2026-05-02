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
    try {
      const result = this.schema.parse(value)
      return result
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const formattedErrors = (error?.errors ?? []).map((err) => ({
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
