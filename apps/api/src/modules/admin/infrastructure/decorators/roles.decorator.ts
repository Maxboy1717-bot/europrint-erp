/**
 * @module roles.decorator
 * @description Custom NestJS decorator. Metadata attachment for guards/interceptors.
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/aggregates/user.aggregate';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
