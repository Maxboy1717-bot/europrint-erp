/**
 * @module kanban-ext.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

// kanban-ext.controller.ts — split into focused sub-controllers
export { KanbanCoreController } from './kanban-core.controller';
export { KanbanReportsController } from './kanban-reports.controller';
export { KanbanCardsController } from './kanban-cards.controller';
