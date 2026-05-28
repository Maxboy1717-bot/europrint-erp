/**
 * @module case-mapper
 * @description P2.2 — snake_case ↔ camelCase boundary mapper.
 * Converts BE snake_case responses to FE camelCase without manual field aliasing.
 */

function camelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function snakeCase(s: string): string {
  return s.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Convert all top-level keys of an object from snake_case to camelCase.
 * Nested objects are NOT recursively converted — use toCamelDeep for that.
 */
export function toCamel<T extends object>(obj: T): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [camelCase(k), v])
  ) as T;
}

/**
 * Recursively convert all keys in an object tree from snake_case to camelCase.
 */
export function toCamelDeep<T>(val: T): T {
  if (Array.isArray(val)) return val.map(toCamelDeep) as unknown as T;
  if (val && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val as object).map(([k, v]) => [camelCase(k), toCamelDeep(v)])
    ) as T;
  }
  return val;
}

/**
 * Convert all top-level keys of an object from camelCase to snake_case.
 */
export function toSnake<T extends object>(obj: T): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [snakeCase(k), v])
  ) as T;
}

/** Map an array of objects from snake_case to camelCase. */
export const toCamelArray = <T extends object>(arr: T[]): T[] =>
  Array.isArray(arr) ? arr.map(toCamel) : [];

/** Map an array of objects from camelCase to snake_case. */
export const toSnakeArray = <T extends object>(arr: T[]): T[] =>
  Array.isArray(arr) ? arr.map(toSnake) : [];
