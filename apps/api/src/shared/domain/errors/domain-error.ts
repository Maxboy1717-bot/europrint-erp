/**
 * @module domain-error
 * @description Domain-layer error class. Thrown by aggregates and value-objects
 * when an invariant is violated and a Result-returning method signature is not
 * available (e.g. constructors, getters). Application/transport layers catch
 * these and translate the `code` into an `AppError` / HTTP exception. Keeps the
 * domain free of NestJS HttpException imports.
 */

export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
