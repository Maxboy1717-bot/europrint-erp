export function errMsg(err: unknown): string {
  return err instanceof Error ? (err as Error).message : String(err);
}
