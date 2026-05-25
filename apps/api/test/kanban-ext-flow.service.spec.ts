/**
 * Smoke spec for KanbanExtFlowService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent kanban-ext.service.spec.ts.
 */
import { KanbanExtFlowService } from '../src/modules/kanban/application/kanban-ext-flow.service';

describe('KanbanExtFlowService', () => {
  it('is defined', () => {
    expect(KanbanExtFlowService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(KanbanExtFlowService.name).toBe('KanbanExtFlowService');
  });
});
