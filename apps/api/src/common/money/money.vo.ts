import Decimal from 'decimal.js';

Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -18, toExpPos: 18 });

export class CurrencyMismatchError extends Error {
  constructor(a: string, b: string) {
    super(`Currency mismatch: ${a} ≠ ${b}`);
    this.name = 'CurrencyMismatchError';
  }
}

export class MoneyArithmeticError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'MoneyArithmeticError';
  }
}

export class Money {
  private readonly _minor: Decimal;
  private readonly _currency: string;

  private static readonly SCALE = 4;

  private constructor(minor: Decimal, currency: string) {
    this._minor = minor;
    this._currency = currency;
  }

  static of(value: number | string | Decimal, currency = 'UZS'): Money {
    if (currency.length !== 3) throw new MoneyArithmeticError(`Invalid currency code: ${currency}`);
    const d = new Decimal(value).toDecimalPlaces(Money.SCALE, Decimal.ROUND_HALF_EVEN);
    return new Money(d, currency.toUpperCase());
  }

  static zero(currency = 'UZS'): Money {
    return Money.of(0, currency);
  }

  private guard(other: Money): void {
    if (this._currency !== other._currency) throw new CurrencyMismatchError(this._currency, other._currency);
  }

  add(other: Money): Money {
    this.guard(other);
    return new Money(this._minor.plus(other._minor).toDecimalPlaces(Money.SCALE, Decimal.ROUND_HALF_EVEN), this._currency);
  }

  subtract(other: Money): Money {
    this.guard(other);
    const result = this._minor.minus(other._minor).toDecimalPlaces(Money.SCALE, Decimal.ROUND_HALF_EVEN);
    if (result.isNegative()) throw new MoneyArithmeticError(`Subtraction yields negative: ${result.toFixed(Money.SCALE)}`);
    return new Money(result, this._currency);
  }

  subtractUnchecked(other: Money): Money {
    this.guard(other);
    return new Money(this._minor.minus(other._minor).toDecimalPlaces(Money.SCALE, Decimal.ROUND_HALF_EVEN), this._currency);
  }

  multiply(factor: number | string | Decimal): Money {
    const d = new Decimal(factor);
    return new Money(this._minor.mul(d).toDecimalPlaces(Money.SCALE, Decimal.ROUND_HALF_EVEN), this._currency);
  }

  divide(divisor: number | string | Decimal): Money {
    const d = new Decimal(divisor);
    if (d.isZero()) throw new MoneyArithmeticError('Division by zero');
    return new Money(this._minor.div(d).toDecimalPlaces(Money.SCALE, Decimal.ROUND_HALF_EVEN), this._currency);
  }

  abs(): Money {
    return new Money(this._minor.abs(), this._currency);
  }

  negate(): Money {
    return new Money(this._minor.negated(), this._currency);
  }

  isZero(): boolean { return this._minor.isZero(); }
  isPositive(): boolean { return this._minor.isPositive() && !this._minor.isZero(); }
  isNegative(): boolean { return this._minor.isNegative(); }

  greaterThan(other: Money): boolean { this.guard(other); return this._minor.gt(other._minor); }
  lessThan(other: Money): boolean { this.guard(other); return this._minor.lt(other._minor); }
  greaterThanOrEqual(other: Money): boolean { this.guard(other); return this._minor.gte(other._minor); }
  lessThanOrEqual(other: Money): boolean { this.guard(other); return this._minor.lte(other._minor); }

  equals(other: Money): boolean {
    return this._currency === other._currency && this._minor.eq(other._minor);
  }

  min(other: Money): Money { this.guard(other); return this._minor.lte(other._minor) ? this : other; }
  max(other: Money): Money { this.guard(other); return this._minor.gte(other._minor) ? this : other; }

  toNumber(): number { return this._minor.toNumber(); }
  toString(): string { return `${this._minor.toFixed(Money.SCALE)} ${this._currency}`; }
  toFixed(dp = 2): string { return this._minor.toFixed(dp); }
  getCurrency(): string { return this._currency; }
  getAmount(): number { return this._minor.toNumber(); }

  toJSON(): { amount: string; currency: string } {
    return { amount: this._minor.toFixed(Money.SCALE), currency: this._currency };
  }

  static fromJSON(obj: { amount: string | number; currency: string }): Money {
    return Money.of(obj.amount, obj.currency);
  }

  static sum(items: Money[], currency = 'UZS'): Money {
    return (items ?? []).reduce((acc, m) => acc.add(m), Money.zero(currency));
  }
}
