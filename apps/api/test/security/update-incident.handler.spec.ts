/**
 * test/security/update-incident.handler.spec.ts
 * Unit tests for UpdateIncidentHandler. IIncidentRepo is mocked; SecurityIncident is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateIncidentHandler } from '../../src/modules/security/application/commands/update-incident.handler';
import { UpdateIncidentCommand } from '../../src/modules/security/application/commands/update-incident.command';
import { INCIDENT_REPO } from '../../src/modules/security/domain/repositories/i-incident.repo';
import { SecurityIncident } from '../../src/modules/security/domain/aggregates/security-incident.aggregate';
import { IncidentSeverity, IncidentType } from '../../src/modules/security/domain/enums/incident-severity.enum';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findOpen: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findOpen: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeIncident(): SecurityIncident {
  return SecurityIncident.create(
    IncidentType.UNAUTHORIZED_ACCESS, IncidentSeverity.HIGH, 't', 'd', 1,
  );
}

describe('UpdateIncidentHandler', () => {
  let handler: UpdateIncidentHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateIncidentHandler,
        { provide: INCIDENT_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(UpdateIncidentHandler);
  });

  it('returns NOT_FOUND when incident does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new UpdateIncidentCommand('missing', 'user1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('assigns incident to user and switches status to investigating when assignedTo is provided', async () => {
    const incident = makeIncident();
    repo.findById.mockResolvedValue(Ok(incident));
    repo.update.mockResolvedValue(Ok(incident));

    await handler.execute(new UpdateIncidentCommand(incident.id, 'user-99'));

    expect(incident.assignedTo).toBe('user-99');
    expect(incident.status).toBe('investigating');
  });

  it('updates incident status when status is provided in command', async () => {
    const incident = makeIncident();
    repo.findById.mockResolvedValue(Ok(incident));
    repo.update.mockResolvedValue(Ok(incident));

    await handler.execute(new UpdateIncidentCommand(incident.id, undefined, 'resolved'));

    expect(incident.status).toBe('resolved');
  });

  it('sets resolutionNotes on aggregate when notes are provided in command', async () => {
    const incident = makeIncident();
    repo.findById.mockResolvedValue(Ok(incident));
    repo.update.mockResolvedValue(Ok(incident));

    await handler.execute(new UpdateIncidentCommand(incident.id, undefined, undefined, 'Some notes'));

    expect(incident.resolutionNotes).toBe('Some notes');
  });

  it('propagates repo error when update fails', async () => {
    repo.findById.mockResolvedValue(Ok(makeIncident()));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new UpdateIncidentCommand('id', 'u1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
