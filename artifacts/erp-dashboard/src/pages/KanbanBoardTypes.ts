/**
 * @module KanbanBoardTypes
 * @description Interfaces, types, and constants for the KanbanBoard page. No JSX.
 *
 * KanbanBoard itself is thin — it delegates nearly everything to sub-components
 * already living in ./kanban/ and @/components/kanban/. This file re-exports the
 * translation type so sub-files have a stable import path from this directory.
 */

// The T translation dictionary is defined in ./kanban/kanban-types.
// Re-export the inferred per-language value type so KanbanBoard sub-files
// can type-annotate `t` without importing from the nested kanban/ directory.
import { T } from "./kanban/kanban-types";

/** Type of a single-language translation bundle (e.g. T["uz"]). */
export type KanbanT = (typeof T)["uz"];

/** All supported UI languages for the board. */
export type KanbanLang = keyof typeof T;
