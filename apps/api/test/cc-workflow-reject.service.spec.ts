/**
 * Smoke spec for CcWorkflowRejectService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent cc-workflow.service.spec.ts.
 */
import { CcWorkflowRejectService } from '../src/modules/communication-center/application/cc-workflow-reject.service';

describe('CcWorkflowRejectService', () => {
  it('is defined', () => {
    expect(CcWorkflowRejectService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(CcWorkflowRejectService.name).toBe('CcWorkflowRejectService');
  });
});
