/**
 * test/security/resolve-incident.handler.spec.ts
 * Unit tests for ResolveIncidentHandler. IIncidentRepo is mocked; SecurityIncident is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ResolveIncidentHandler, ResolveIncidentCommand } from '../../src/modules/security/application/commands/resolve-incident.handler';
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
    IncidentType.UNAUTHORIZED_ACCESS, IncidentSeverity.HIGH,
    'title', 'description', 1,
  );
}

describe('ResolveIncidentHandler', () => {
  let handler: ResolveIncidentHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ResolveIncidentHandler,
        { provide: INCIDENT_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(ResolveIncidentHandler);
  });

  it('returns VALIDATION when resolution notes are shorter than 20 chars', async () => {
    const r = await handler.execute(new ResolveIncidentCommand('id', 'too short'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when incident does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(
      new ResolveIncidentCommand('missing', 'Detailed resolution explanation here'),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('sets incident status to closed and persists when notes are valid', async () => {
    const incident = makeIncident();
    repo.findById.mockResolvedValue(Ok(incident));
    repo.update.mockResolvedValue(Ok(incident));

    const r = await handler.execute(
      new ResolveIncidentCommand(incident.id, 'Detailed resolution explanation here'),
    );

    expect(r.ok).toBe(true);
    expect(incident.status).toBe('closed');
    expect(incident.resolvedAt).not.toBeNull();
  });

  it('passes resolution notes to repo.update when notes are valid', async () => {
    const incident = makeIncident();
    repo.findById.mockResolvedValue(Ok(incident));
    repo.update.mockResolvedValue(Ok(incident));

    await handler.execute(
      new ResolveIncidentCommand(incident.id, 'Long enough resolution notes here'),
    );

    expect(repo.update).toHaveBeenCalledWith(incident.id, expect.objectContaining({
      status: 'closed',
      resolutionNotes: 'Long enough resolution notes here',
    }));
  });

  it('propagates repo error when update fails', async () => {
    const incident = makeIncident();
    repo.findById.mockResolvedValue(Ok(incident));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(
      new ResolveIncidentCommand(incident.id, 'Long enough resolution notes here'),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
