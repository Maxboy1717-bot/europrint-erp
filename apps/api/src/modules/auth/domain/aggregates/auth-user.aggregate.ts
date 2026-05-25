/**
 * @module auth-user.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { PasswordValueObject } from '../value-objects/password.vo';
import { IPasswordHasher } from '../ports/i-password-hasher.port';

export interface AuthUserData {
  id: number;
  username: string;
  passwordHash: string;
  email: string;
  role?: string;
  isActive: boolean;
  lastLogin: Date | null;
  failedLoginAttempts: number;
  lockUntil: Date | null;
}

export class AuthUserAggregate {
  private id: number;
  private username: string;
  private password: PasswordValueObject;
  private email: string;
  private role: string;
  private isActive: boolean;
  private lastLogin: Date | null;
  private failedLoginAttempts: number;
  private lockUntil: Date | null;

  constructor(data: AuthUserData) {
    this.id = data.id;
    this.username = data.username;
    this.password = PasswordValueObject.createFromHash(data.passwordHash);
    this.email = data.email;
    this.role = data.role ?? 'employee';
    this.isActive = data.isActive;
    this.lastLogin = data.lastLogin;
    this.failedLoginAttempts = data.failedLoginAttempts;
    this.lockUntil = data.lockUntil;
  }

  static create(username: string, email: string, password: PasswordValueObject): AuthUserAggregate {
    return new AuthUserAggregate({
      id: 0,
      username,
      email,
      passwordHash: password.getHash(),
      isActive: true,
      lastLogin: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
  }

  getId(): number {
    return this.id;
  }

  getUsername(): string {
    return this.username;
  }

  getEmail(): string {
    return this.email;
  }

  getRole(): string {
    return this.role;
  }

  isAccountActive(): boolean {
    return this.isActive;
  }

  async verifyPassword(plainPassword: string, hasher: IPasswordHasher): Promise<boolean> {
    return hasher.verify(plainPassword, this.password.getHash());
  }

  getFailedLoginAttempts(): number {
    return this.failedLoginAttempts;
  }

  isAccountLocked(): boolean {
    if (!this.lockUntil) return false;
    return _time.now() < this.lockUntil;
  }

  incrementFailedAttempts(): void {
    this.failedLoginAttempts += 1;
  }

  lockAccount(minutesDuration: number = 30): void {
    const lockUntil = _time.now();
    lockUntil.setMinutes(lockUntil.getMinutes() + minutesDuration);
    this.lockUntil = lockUntil;
  }

  resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
  }

  updateLastLogin(timestamp: Date): void {
    this.lastLogin = timestamp;
  }

  getLastLogin(): Date | null {
    return this.lastLogin;
  }

  async changePassword(
    oldPassword: string,
    newPassword: PasswordValueObject,
    hasher: IPasswordHasher,
  ): Promise<boolean> {
    const isValid = await hasher.verify(oldPassword, this.password.getHash());
    if (!isValid) {
      return false;
    }
    this.password = newPassword;
    return true;
  }

  toPersistence(): AuthUserData {
    return {
      id: this.id,
      username: this.username,
      passwordHash: this.password.getHash(),
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      failedLoginAttempts: this.failedLoginAttempts,
      lockUntil: this.lockUntil,
    };
  }
}
