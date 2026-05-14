/**
 * @module password.vo
 * @description Value object. Immutable domain primitive with validation in its factory.
 */

import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export class PasswordValueObject {
  private readonly hash: string;
  private readonly salt: string = '$2b$10$';

  private constructor(hash: string) {
    this.hash = hash;
  }

  static async create(plainPassword: string): Promise<PasswordValueObject> {
    PasswordValueObject.validateComplexity(plainPassword);
    const hash = await bcrypt.hash(plainPassword, 10);
    return new PasswordValueObject(hash);
  }

  static createFromHash(hash: string): PasswordValueObject {
    if (!hash.startsWith('$2b$')) {
      throw new InternalServerErrorException('Invalid bcrypt hash format');
    }
    return new PasswordValueObject(hash);
  }

  private static validateComplexity(password: string): void {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Parol kamida 1 ta katta harfni o\'z ichiga olishi kerak');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Parol kamida 1 ta kichik harfni o\'z ichiga olishi kerak');
    }
    if (!/\d/.test(password)) {
      errors.push('Parol kamida 1 ta raqamni o\'z ichiga olishi kerak');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Parol kamida 1 ta maxsus belgini o\'z ichiga olishi kerak');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }
  }

  async verify(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hash);
  }

  getHash(): string {
    return this.hash;
  }
}
