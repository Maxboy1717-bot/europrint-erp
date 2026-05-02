import { ValueObject } from '../value-object.base';
import { Result } from '../result';

export class Money extends ValueObject {
  private readonly value: number;
  private readonly currency: string;

  private constructor(value: number, currency: string) {
    super();
    this.value = value;
    this.currency = currency;
  }

  static create(value: number, currency: string = 'USD'): Result<Money> {
    if (value < 0) {
      return Result.fail('Money value cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      return Result.fail('Invalid currency code');
    }
    return Result.ok(new Money(value, currency.toUpperCase()));
  }

  static of(value: number, currency: string = 'USD'): Money {
    return new Money(Math.max(0, value), (currency || 'USD').toUpperCase());
  }

  getValue(): number {
    return this.value;
  }

  getCurrency(): string {
    return this.currency;
  }

  equals(other: Money): boolean {
    return this.value === other.value && this.currency === other.currency;
  }

  add(other: Money): Result<Money> {
    if (this.currency !== other.currency) {
      return Result.fail('Cannot add money with different currencies');
    }
    return Money.create(this.value + other.value, this.currency);
  }

  subtract(other: Money): Result<Money> {
    if (this.currency !== other.currency) {
      return Result.fail('Cannot subtract money with different currencies');
    }
    if (this.value < other.value) {
      return Result.fail('Cannot subtract larger amount');
    }
    return Money.create(this.value - other.value, this.currency);
  }
}
