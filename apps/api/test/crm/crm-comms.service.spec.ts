/**
 * crm-comms.service.spec.ts
 *
 * Unit tests for CrmCommsService. The repository (the external "log channel")
 * is mocked; the real envelope-shape ({ sent: true, ... }) is asserted.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmCommsService } from '../../src/modules/crm/application/crm-comms.service';
import { CrmCommsRepository } from '../../src/modules/crm/application/crm-comms.repository';
import { Ok, Err, AppErr } from '../../src/common/result';

type RepoMock = {
  logEmail: jest.Mock;
  scheduleMeeting: jest.Mock;
  logSms: jest.Mock;
  logWhatsapp: jest.Mock;
};

function makeRepo(): RepoMock {
  return {
    logEmail: jest.fn(),
    scheduleMeeting: jest.fn(),
    logSms: jest.fn(),
    logWhatsapp: jest.fn(),
  };
}

describe('CrmCommsService', () => {
  let svc: CrmCommsService;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmCommsService,
        { provide: CrmCommsRepository, useValue: repo },
      ],
    }).compile();
    svc = module.get(CrmCommsService);
  });

  it('returns sent envelope when sendEmail succeeds', async () => {
    repo.logEmail.mockResolvedValue(Ok({ id: 1 }));
    const r = await svc.sendEmail('to@x.com', 'Hi', 'body', 1, null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { sent: boolean; to: string; subject: string };
      expect(data.sent).toBe(true);
      expect(data.to).toBe('to@x.com');
      expect(data.subject).toBe('Hi');
    }
  });

  it('returns Err when sendEmail repository fails', async () => {
    repo.logEmail.mockResolvedValue(Err(AppErr('DB_ERROR', 'log failed')));
    const r = await svc.sendEmail('to@x.com', 'Hi', 'body', null, null);
    expect(r.ok).toBe(false);
  });

  it('returns scheduled meeting row when scheduleMeeting succeeds', async () => {
    repo.scheduleMeeting.mockResolvedValue(Ok({ id: 99, title: 'Demo' }));
    const r = await svc.scheduleMeeting('Demo', 1, null, '2026-06-01', ['a']);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { id: number };
      expect(data.id).toBe(99);
    }
  });

  it('returns synthesized row when scheduleMeeting repo returns null', async () => {
    repo.scheduleMeeting.mockResolvedValue(Ok(null));
    const r = await svc.scheduleMeeting('Demo', 1, null, '2026-06-01', []);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { title: string; status: string };
      expect(data.title).toBe('Demo');
      expect(data.status).toBe('pending');
    }
  });

  it('measures message length when sendSms succeeds', async () => {
    repo.logSms.mockResolvedValue(Ok({ id: 1 }));
    const r = await svc.sendSms('+998901234567', 'Hello SMS', 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { message_length: number; phone: string };
      expect(data.message_length).toBe('Hello SMS'.length);
      expect(data.phone).toBe('+998901234567');
    }
  });

  it('returns whatsapp channel envelope when sendWhatsapp succeeds', async () => {
    repo.logWhatsapp.mockResolvedValue(Ok({ id: 1 }));
    const r = await svc.sendWhatsapp('+998901234567', 'wa msg', null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { channel: string };
      expect(data.channel).toBe('whatsapp');
    }
  });

  it('returns Err when sendWhatsapp repo fails', async () => {
    repo.logWhatsapp.mockResolvedValue(Err(AppErr('DB_ERROR', 'log failed')));
    const r = await svc.sendWhatsapp('+998901234567', 'wa msg', null);
    expect(r.ok).toBe(false);
  });
});
