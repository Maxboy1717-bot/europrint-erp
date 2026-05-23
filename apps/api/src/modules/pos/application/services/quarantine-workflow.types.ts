/**
 * @module quarantine-workflow.types
 * @description Shared types for quarantine workflow (service + repository).
 *   Extracted to break the cyclic dependency.
 * @layer Types (POS)
 */

export type MovementStatus =
  | 'draft' | 'pending' | 'karantin' | 'qc_review'
  | 'approved' | 'rejected' | 'completed' | 'cancelled';
