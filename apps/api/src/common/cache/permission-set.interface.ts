/**
 * @module permission-set.interface
 * @description Type-only exports (interfaces, type aliases, enums). No runtime code.
 */

export interface PermissionSet {
  actions: string[];
  resources: string[];
  conditions?: Record<string, string>;
}
