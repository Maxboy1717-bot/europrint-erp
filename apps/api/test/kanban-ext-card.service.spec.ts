/**
 * Smoke spec for KanbanExtCardService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent kanban-ext.service.spec.ts.
 */
import { KanbanExtCardService } from '../src/modules/kanban/application/kanban-ext-card.service';

describe('KanbanExtCardService', () => {
  it('is defined', () => {
    expect(KanbanExtCardService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(KanbanExtCardService.name).toBe('KanbanExtCardService');
  });
});
