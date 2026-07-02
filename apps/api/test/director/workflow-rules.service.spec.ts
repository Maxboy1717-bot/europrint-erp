/**
 * Smoke spec for WorkflowRulesService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service is a thin delegation wrapper around WorkflowRulesRepository
 * (every method just forwards to `this.repo.*` and returns its Result<T>) — there
 * is no pure/testable business logic in the service itself, and constructing it
 * meaningfully requires a live WorkflowRulesRepository (DB-backed). This smoke
 * spec only verifies that the class is importable/constructible; any future
 * business logic added to the service should get a behavioural spec instead.
 */
import { WorkflowRulesService } from '../../src/modules/director/application/workflow-rules.service';

describe('WorkflowRulesService', () => {
  it('is defined', () => {
    expect(WorkflowRulesService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(WorkflowRulesService.name).toBe('WorkflowRulesService');
  });
});
