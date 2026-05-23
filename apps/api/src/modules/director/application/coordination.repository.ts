/**
 * Re-export shim: CoordinationRepository lives in infrastructure/repositories.
 * This barrel keeps the test import path aligned with the application layer.
 */
export { CoordinationRepository } from '../infrastructure/repositories/coordination.repository';
