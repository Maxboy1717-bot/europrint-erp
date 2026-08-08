/**
 * @module kanban-tables
 * @description Re-export shim. The canonical declarations for kanban_boards /
 *              kanban_columns / kanban_cards now live in
 *              `apps/api/src/shared/db/schema-kanban.ts` (per P3-27). Infra
 *              files must import from here or directly from `@shared/db` —
 *              they must NOT re-declare these tables.
 */

export { kanbanBoards, kanbanColumns, kanbanCards, kanbanStatusColumnMap } from '@shared/db/schema-kanban';
