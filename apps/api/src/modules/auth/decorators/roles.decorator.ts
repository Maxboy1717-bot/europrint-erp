/**
 * @module roles.decorator
 * @description Custom NestJS decorator. Metadata attachment for guards/interceptors.
 */

import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
