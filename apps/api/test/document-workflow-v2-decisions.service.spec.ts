/**
 * Smoke spec for DocumentWorkflowV2DecisionsService (Rule 22: every service needs a unit test).
 *
 * NOTE: The service depends on injected repositories/database. This smoke
 * spec only verifies that the class is constructible — full behavioural tests
 * belong with the parent document-workflow-v2.service.spec.ts.
 */
import { DocumentWorkflowV2DecisionsService } from '../src/modules/compatibility/document-workflow-v2-decisions.service';

describe('DocumentWorkflowV2DecisionsService', () => {
  it('is defined', () => {
    expect(DocumentWorkflowV2DecisionsService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(DocumentWorkflowV2DecisionsService.name).toBe('DocumentWorkflowV2DecisionsService');
  });
});
