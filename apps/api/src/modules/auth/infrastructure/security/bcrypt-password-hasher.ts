/**
 * @module bcrypt-password-hasher
 * @description Infrastructure adapter for {@link IPasswordHasher} backed by the
 * `bcrypt` npm package. Bound to the {@link PASSWORD_HASHER} token in
 * `auth.module.ts`.
 *
 * Cost factor (`BCRYPT_ROUNDS`) is set to 10 to match the canonical level used
 * elsewhere in the codebase (see `admin/application/services/create-user.service.ts`,
 * `compatibility/employees-compat-financials.service.ts`,
 * `communication-center/application/cc-pin.service.ts`). Bumping the cost is a
 * one-line change here and does not require touching any consumer.
 */

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/ports/i-password-hasher.port';

/** Salt rounds for bcrypt. Matches the canonical level used by `admin/create-user.service.ts`. */
const BCRYPT_ROUNDS = 10;

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
