/** Cast any value to a typed result. Use at repository/service boundary only. */
export const castTo = <T>(v: unknown): T => v as T;
