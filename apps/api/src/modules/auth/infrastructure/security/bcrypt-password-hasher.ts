/**
 * @module bcrypt-password-hasher
 * @description Infrastructure adapter for {@link IPasswordHasher} backed by the
 * `bcrypt` npm package. Bound to the {@link PASSWORD_HASHER} token in
 * `auth.module.ts`.
 *
 * SECURITY: PA-S5 — cost factor is imported from
 * `@common/constants/security.constants` so admin seed and runtime hasher
 * agree on the same rounds value (was previously 10 here vs. 12 in the seeder).
 */

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '@common/constants/security.constants';
import { IPasswordHasher } from '../../domain/ports/i-password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
