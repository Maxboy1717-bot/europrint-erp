import { InternalServerErrorException } from '@nestjs/common';
export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'UZS',
  ) {
    if (amount < 0) throw new InternalServerErrorException('Money amount cannot be negative');
  }
  static of(amount: number, currency = 'UZS'): Money {
    return new Money(amount, currency);
  }
  getAmount(): number { return this.amount; }
  getCurrency(): string { return this.currency; }
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new InternalServerErrorException('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }
  toNumber(): number { return this.amount; }
  toString(): string { return this.amount + ' ' + this.currency; }
}
