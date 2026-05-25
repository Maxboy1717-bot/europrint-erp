/**
 * Re-export shim: StrategicRepository lives in infrastructure/repositories.
 * This barrel keeps the test import path aligned with the application layer.
 */
export { StrategicRepository } from '../infrastructure/repositories/strategic.repository';
