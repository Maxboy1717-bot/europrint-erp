/**
 * @module current-user.decorator
 * @description Custom NestJS decorator. Metadata attachment for guards/interceptors.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthenticatedUser } from '../types/user.types'

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest()
    return request.user as AuthenticatedUser
  },
)
