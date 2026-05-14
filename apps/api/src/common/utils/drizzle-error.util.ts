/**
 * Extracts a readable error message from Drizzle ORM errors.
 *
 * Drizzle wraps PostgreSQL errors: the top-level message is
 * "Failed query: <SQL>", and the real PG error sits in `err.cause`.
 * This helper surfaces the cause message alongside the outer message.
 */
export function extractDrizzleError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = (err as { cause?: unknown }).cause;
  let causeMsg: string | undefined;
  if (cause instanceof Error) {
    causeMsg = cause.message;
  } else if (cause && typeof cause === 'object' && 'message' in cause) {
    causeMsg = String((cause as { message: unknown }).message);
  }
  return causeMsg ? `${err.message} | PG: ${causeMsg}` : err.message;
}
