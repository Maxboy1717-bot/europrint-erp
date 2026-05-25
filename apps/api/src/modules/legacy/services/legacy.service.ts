/**
 * @module legacy.service (re-export)
 * @description Compatibility shim. The canonical implementation lives in the
 * `general` module. This file re-exports it under the legacy path so that
 * test files and older imports continue to work without modification.
 */
export { LegacyService } from '../../general/services/legacy.service';
