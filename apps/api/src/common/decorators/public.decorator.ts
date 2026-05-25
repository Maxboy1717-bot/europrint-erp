/**
 * @module public.decorator
 * @description Custom NestJS decorator. Metadata attachment for guards/interceptors.
 */

import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
