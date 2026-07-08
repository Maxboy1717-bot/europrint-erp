/**
 * node-portret.service.spec.ts — Rule 22 coverage for NodePortretService.
 *
 * Covers the ensure-tables-and-retry-once pattern shared by all four public
 * methods (getPortret / savePortret / getHrRequests / createHrRequest):
 *   1. success on first attempt → repo.ensureTables() is never called
 *   2. first attempt fails → ensureTables() runs, then a single retry
 *   3. retry also fails → the service surfaces the retry's error (not the
 *      first attempt's) via Err/raw-Result passthrough
 *   4. response-shape wrapping ({ portret }, { requests: [] }, { request })
 *      and the null/array coalescing on the success payload
 */
import { NodePortretService } from '../src/modules/org-structure/node-portret.service';
import { Ok, Err, AppErr } from '../src/common/result';

interface FakeRepo {
  ensureTables: jest.Mock;
  getPortret: jest.Mock;
  upsertPortret: jest.Mock;
  getHrRequests: jest.Mock;
  createHrRequest: jest.Mock;
  getNodeCardInfo: jest.Mock;
  getPortretRecipientEmails: jest.Mock;
}

interface FakeEmailSender {
  send: jest.Mock;
  sendNotification: jest.Mock;
}

function makeRepo(overrides: Partial<FakeRepo> = {}): FakeRepo {
  return {
    ensureTables: jest.fn().mockResolvedValue(undefined),
    getPortret: jest.fn(),
    upsertPortret: jest.fn(),
    getHrRequests: jest.fn(),
    createHrRequest: jest.fn(),
    getNodeCardInfo: jest.fn(),
    getPortretRecipientEmails: jest.fn(),
    ...overrides,
  };
}

function makeEmailSender(overrides: Partial<FakeEmailSender> = {}): FakeEmailSender {
  return {
    send: jest.fn().mockResolvedValue(Ok(undefined)),
    sendNotification: jest.fn().mockResolvedValue(Ok(undefined)),
    ...overrides,
  };
}

function svc(repo: FakeRepo, emailSender: FakeEmailSender = makeEmailSender()): NodePortretService {
  // Test double: NodePortretService only calls the repo/email-sender methods
  // mocked above, so casting via `as never` avoids an `as unknown` stub
  // (Rule 5) while keeping tsc happy — mirrors test/org-structure-move.spec.ts.
  return new NodePortretService(repo as never, emailSender as never);
}

describe('NodePortretService', () => {
  describe('getPortret', () => {
    it('returns Ok({ portret }) on first-try success without calling ensureTables', async () => {
      const repo = makeRepo({
        getPortret: jest.fn().mockResolvedValue(Ok({ id: 1, node_id: 7 })),
      });
      const result = await svc(repo).getPortret(7);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ portret: { id: 1, node_id: 7 } });
      expect(repo.ensureTables).not.toHaveBeenCalled();
      expect(repo.getPortret).toHaveBeenCalledTimes(1);
    });

    it('coalesces a missing row to portret: null', async () => {
      const repo = makeRepo({
        getPortret: jest.fn().mockResolvedValue(Ok(null)),
      });
      const result = await svc(repo).getPortret(7);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ portret: null });
    });

    it('ensures tables and retries once when the first read fails, then succeeds', async () => {
      const repo = makeRepo({
        getPortret: jest
          .fn()
          .mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'relation does not exist')))
          .mockResolvedValueOnce(Ok({ id: 2, node_id: 9 })),
      });
      const result = await svc(repo).getPortret(9);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ portret: { id: 2, node_id: 9 } });
      expect(repo.ensureTables).toHaveBeenCalledTimes(1);
      expect(repo.getPortret).toHaveBeenCalledTimes(2);
    });

    it('surfaces the retry error (not the original) when both attempts fail', async () => {
      const repo = makeRepo({
        getPortret: jest
          .fn()
          .mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'first failure')))
          .mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'second failure'))),
      });
      const result = await svc(repo).getPortret(9);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('second failure');
      expect(repo.ensureTables).toHaveBeenCalledTimes(1);
      expect(repo.getPortret).toHaveBeenCalledTimes(2);
    });
  });

  describe('savePortret', () => {
    it('wraps a successful upsert as Ok({ portret })', async () => {
      const repo = makeRepo({
        upsertPortret: jest.fn().mockResolvedValue(Ok({ id: 3, node_id: 5, portret_data: { a: 1 } })),
      });
      const result = await svc(repo).savePortret(5, { a: 1 }, 42);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ portret: { id: 3, node_id: 5, portret_data: { a: 1 } } });
      expect(repo.upsertPortret).toHaveBeenCalledWith(5, { a: 1 }, 42);
      expect(repo.ensureTables).not.toHaveBeenCalled();
    });

    it('retries once via ensureTables when the first upsert fails', async () => {
      const repo = makeRepo({
        upsertPortret: jest
          .fn()
          .mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'no such table')))
          .mockResolvedValueOnce(Ok({ id: 4, node_id: 6 })),
      });
      const result = await svc(repo).savePortret(6, {}, null);
      expect(result.ok).toBe(true);
      expect(repo.ensureTables).toHaveBeenCalledTimes(1);
      expect(repo.upsertPortret).toHaveBeenCalledTimes(2);
    });

    it('passes through the raw failure Result when the retry also fails', async () => {
      const failure = Err(AppErr('DB_ERROR', 'still broken'));
      const repo = makeRepo({
        upsertPortret: jest.fn().mockResolvedValue(failure),
      });
      const result = await svc(repo).savePortret(6, {}, null);
      expect(result).toBe(failure);
    });
  });

  describe('getHrRequests', () => {
    it('wraps rows as Ok({ requests })', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const repo = makeRepo({
        getHrRequests: jest.fn().mockResolvedValue(Ok(rows)),
      });
      const result = await svc(repo).getHrRequests(11);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ requests: rows });
    });

    it('defaults a non-array payload to an empty requests array', async () => {
      const repo = makeRepo({
        getHrRequests: jest.fn().mockResolvedValue(Ok(undefined)),
      });
      const result = await svc(repo).getHrRequests(11);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ requests: [] });
    });

    it('ensures tables and retries once on first failure', async () => {
      const repo = makeRepo({
        getHrRequests: jest
          .fn()
          .mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'missing table')))
          .mockResolvedValueOnce(Ok([{ id: 9 }])),
      });
      const result = await svc(repo).getHrRequests(11);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ requests: [{ id: 9 }] });
      expect(repo.ensureTables).toHaveBeenCalledTimes(1);
    });
  });

  describe('createHrRequest', () => {
    it('wraps a successful insert as Ok({ request })', async () => {
      const created = { id: 5, node_id: 3, request_type: 'new_hire' };
      const repo = makeRepo({
        createHrRequest: jest.fn().mockResolvedValue(Ok(created)),
      });
      const dto = { requestType: 'new_hire', priority: 'normal' };
      const result = await svc(repo).createHrRequest(3, dto, 42);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual({ request: created });
      expect(repo.createHrRequest).toHaveBeenCalledWith(3, dto, 42);
    });

    it('retries once via ensureTables when the first insert fails', async () => {
      const repo = makeRepo({
        createHrRequest: jest
          .fn()
          .mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'no such table')))
          .mockResolvedValueOnce(Ok({ id: 6 })),
      });
      const result = await svc(repo).createHrRequest(3, {}, null);
      expect(result.ok).toBe(true);
      expect(repo.ensureTables).toHaveBeenCalledTimes(1);
      expect(repo.createHrRequest).toHaveBeenCalledTimes(2);
    });

    it('passes through the raw failure Result when the retry also fails', async () => {
      const failure = Err(AppErr('DB_ERROR', 'still broken'));
      const repo = makeRepo({
        createHrRequest: jest.fn().mockResolvedValue(failure),
      });
      const result = await svc(repo).createHrRequest(3, {}, null);
      expect(result).toBe(failure);
    });
  });

  describe('generatePortretPdf', () => {
    const cardRow = {
      id: 7,
      name: 'Bosh texnolog',
      parent_name: 'Ishlab chiqarish',
      description: 'Ishlab chiqarish jarayonini boshqaradi',
      razryad_level_id: 3,
      razryad_level: 4,
      razryad_name: '4-razryad',
      razryad_min_requirement: '2 yillik tajriba',
      tskp: 'Sifatli mahsulot chiqarish',
      tskp_target: 1000,
      tskp_measurement_unit: 'SON',
      salary_type: 'oylik',
      min_salary: '3000000',
      max_salary: '5000000',
    };

    it('returns NOT_FOUND (and never builds a PDF) when the card does not exist', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Ok(null)),
      });
      const result = await svc(repo).generatePortretPdf(999);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      expect(repo.getPortret).not.toHaveBeenCalled();
    });

    it('propagates a DB failure from getNodeCardInfo', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'connection lost'))),
      });
      const result = await svc(repo).generatePortretPdf(7);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('connection lost');
    });

    it('builds a real PDF buffer when the card exists but no portret was ever saved', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Ok(cardRow)),
        getPortret: jest.fn().mockResolvedValue(Ok(null)),
      });
      const result = await svc(repo).generatePortretPdf(7);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Buffer.isBuffer(result.data)).toBe(true);
        expect(result.data.subarray(0, 5).toString('latin1')).toBe('%PDF-');
      }
    });

    it('builds a PDF that embeds saved portret_data fields (razryad/salary/requirements)', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Ok(cardRow)),
        getPortret: jest.fn().mockResolvedValue(Ok({
          id: 1,
          node_id: 7,
          portret_data: { portret: { main_purpose: 'Ishlab chiqarish sifatini nazorat qilish' } },
        })),
      });
      const result = await svc(repo).generatePortretPdf(7);
      expect(result.ok).toBe(true);
      expect(repo.getNodeCardInfo).toHaveBeenCalledWith(7);
      expect(repo.getPortret).toHaveBeenCalledWith(7);
    });
  });

  describe('sendPortretEmail', () => {
    const cardRow = { id: 7, name: 'Bosh texnolog' };

    it('fails without calling the email sender when the card itself is missing', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Ok(null)),
      });
      const emailSender = makeEmailSender();
      const result = await svc(repo, emailSender).sendPortretEmail(999);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      expect(emailSender.send).not.toHaveBeenCalled();
      expect(repo.getPortretRecipientEmails).not.toHaveBeenCalled();
    });

    it('returns a VALIDATION error and sends nothing when no recipient email exists', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Ok(cardRow)),
        getPortret: jest.fn().mockResolvedValue(Ok(null)),
        getPortretRecipientEmails: jest.fn().mockResolvedValue(Ok([])),
      });
      const emailSender = makeEmailSender();
      const result = await svc(repo, emailSender).sendPortretEmail(7);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('VALIDATION');
      expect(emailSender.send).not.toHaveBeenCalled();
    });

    it('emails every recipient with the PDF attached and reports sent/failed counts', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Ok(cardRow)),
        getPortret: jest.fn().mockResolvedValue(Ok(null)),
        getPortretRecipientEmails: jest.fn().mockResolvedValue(Ok(['hr@europrint.uz', 'xodim@europrint.uz'])),
      });
      const emailSender = makeEmailSender({
        send: jest.fn()
          .mockResolvedValueOnce(Ok(undefined))
          .mockResolvedValueOnce(Err(AppErr('EXTERNAL_SERVICE', 'SMTP down'))),
      });
      const result = await svc(repo, emailSender).sendPortretEmail(7);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({
          sent: 1,
          failed: 1,
          recipients: ['hr@europrint.uz', 'xodim@europrint.uz'],
        });
      }
      expect(emailSender.send).toHaveBeenCalledTimes(2);
      const firstCall = emailSender.send.mock.calls[0][0];
      expect(firstCall.to).toBe('hr@europrint.uz');
      expect(firstCall.attachments).toHaveLength(1);
      expect(Buffer.isBuffer(firstCall.attachments[0].content)).toBe(true);
      expect(firstCall.attachments[0].filename).toBe('portret-karta-7.pdf');
    });

    it('propagates a DB failure from getPortretRecipientEmails without sending', async () => {
      const repo = makeRepo({
        getNodeCardInfo: jest.fn().mockResolvedValue(Ok(cardRow)),
        getPortret: jest.fn().mockResolvedValue(Ok(null)),
        getPortretRecipientEmails: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'recipients query failed'))),
      });
      const emailSender = makeEmailSender();
      const result = await svc(repo, emailSender).sendPortretEmail(7);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('recipients query failed');
      expect(emailSender.send).not.toHaveBeenCalled();
    });
  });
});
