export interface PermissionSet {
  actions: string[];
  resources: string[];
  conditions?: Record<string, string>;
}
