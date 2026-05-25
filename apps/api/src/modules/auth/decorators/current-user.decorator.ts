/**
 * @module current-user.decorator
 * @description Custom NestJS decorator. Metadata attachment for guards/interceptors.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
