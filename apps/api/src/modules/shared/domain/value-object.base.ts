/**
 * @module value-object.base
 * @description Source module. See exports for details.
 */

export abstract class ValueObject<T> {
  constructor(protected readonly _value: T) {}
  get value(): T { return this._value; }
  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    return JSON.stringify(this._value) === JSON.stringify(other._value);
  }
}
