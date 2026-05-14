/**
 * kanban-utils — Small helpers to bridge snake_case backend responses
 * with camelCase TypeScript types in kanban views.
 *
 * Usage:
 *   getProp<string>(card, 'dueDate', 'due_date')
 *   getPersonName(card.creator)
 */

/** Read the first defined value from `obj` by trying each key in order. */
export function getProp<T>(obj: unknown, ...keys: string[]): T | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const val = record[key];
    if (val !== undefined && val !== null) return val as T;
  }
  return undefined;
}

/** Return full name from a person-like object, trying both casing conventions. */
export function getPersonName(person: unknown): string {
  return String(getProp<string>(person, 'fullName', 'full_name') ?? "Noma'lum");
}

/** Return initials (up to 2 chars) from a name string. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?';
}
