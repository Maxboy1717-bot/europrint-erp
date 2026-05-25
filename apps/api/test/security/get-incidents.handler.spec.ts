/**
 * test/security/get-incidents.handler.spec.ts
 * Unit tests for GetIncidentsHandler. IIncidentRepo is mocked; SecurityIncident is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetIncidentsHandler } from '../../src/modules/security/application/queries/get-incidents.handler';
import { GetIncidentsQuery } from '../../src/modules/security/application/queries/get-incidents.query';
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
  return SecurityIncident.create(IncidentType.UNAUTHORIZED_ACCESS, IncidentSeverity.LOW, 't', 'd', 1);
}

describe('GetIncidentsHandler', () => {
  let handler: GetIncidentsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetIncidentsHandler,
        { provide: INCIDENT_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetIncidentsHandler);
  });

  it('returns Ok with PaginatedResult when repo returns incidents', async () => {
    const items = [makeIncident(), makeIncident()];
    repo.findAll.mockResolvedValue(Ok({ items, total: 2 }));

    const r = await handler.execute(new GetIncidentsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('defaults page=1 and limit=10 when filters omit pagination', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    const r = await handler.execute(new GetIncidentsQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('passes severity + status + pagination filters through to repo unchanged', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetIncidentsQuery({
      severity: 'critical', status: 'open', page: 2, limit: 20,
    }));

    expect(repo.findAll).toHaveBeenCalledWith({
      severity: 'critical', status: 'open', page: 2, limit: 20,
    });
  });

  it('propagates repo error when findAll fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetIncidentsQuery({}));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
