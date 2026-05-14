/**
 * @module roles.decorator
 * @description Custom NestJS decorator. Metadata attachment for guards/interceptors.
 */

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
