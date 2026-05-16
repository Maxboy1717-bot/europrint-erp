/**
 * @module money.vo
 * @description Value object. Immutable domain primitive with validation in its factory.
 */

import { DomainError } from '../../../../shared/domain/errors/domain-error';
export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'UZS',
  ) {
    if (amount < 0) throw new DomainError('INVALID_AMOUNT', 'Money amount cannot be negative');
  }
  static of(amount: number, currency = 'UZS'): Money {
    return new Money(amount, currency);
  }
  getAmount(): number { return this.amount; }
  getCurrency(): string { return this.currency; }
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new DomainError('CURRENCY_MISMATCH', 'Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }
  toNumber(): number { return this.amount; }
  toString(): string { return this.amount + ' ' + this.currency; }
}
