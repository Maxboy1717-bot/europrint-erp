/**
 * Re-export shim: OkrRepository lives in infrastructure/repositories.
 * This barrel keeps the test import path aligned with the application layer.
 */
export { OkrRepository } from '../infrastructure/repositories/okr.repository';
