/**
 * @module hr-v2-error
 * @description Source module. See exports for details.
 */

export function errMsg(err: unknown): string {
  return err instanceof Error ? (err as Error).message : String(err);
}
