/**
 * @module value-object.base
 * @description Source module. See exports for details.
 */

export abstract class ValueObject {
  abstract equals(other: ValueObject): boolean;
}
