/**
 * Smoke + unit spec for AI automation event handlers (Rule 22).
 *
 * The handlers are thin CQRS adapters over `CrmAiService`, `HrAiService`,
 * `FinanceAiAnalysisService` and `AiAutomationRepository`. Their behaviour
 * is covered domain-side by the corresponding feature specs. Here we
 * verify:
 *   1. Handlers are defined and constructible with mocked dependencies.
 *   2. Each handler delegates to its collaborator with the event payload.
 *   3. Failure modes return without throwing (the CRM handler returns an
 *      ok-Result; the HR/Finance handlers swallow downstream errors and
 *      just log).
 */
import {
  AiAutomationEventsService,
  AiLeadScoreHandler,
  AiCandidateScreeningHandler,
  AiInvoiceClassifyHandler,
} from '../../src/modules/ai/services/ai-automation-events.service';

describe('AiAutomationEventsService', () => {
  it('is defined (back-compat marker)', () => {
    const svc = new AiAutomationEventsService();
    expect(svc).toBeDefined();
  });
});

describe('AiLeadScoreHandler', () => {
  const makeRepo = () => ({
    updateLeadAiScoreEvent: jest.fn().mockResolvedValue(undefined),
  });
  const makeCrm = (score = 87, grade = 'A') => ({
    scoreLead: jest.fn().mockResolvedValue({ ok: true, data: { score, grade } }),
  });

  it('is defined', () => {
    expect(AiLeadScoreHandler).toBeDefined();
  });

  it('persists score+grade when scoring succeeds', async () => {
    const crm = makeCrm(72, 'B');
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = new AiLeadScoreHandler(crm as any, repo as any);
    const event = { props: { leadId: 101, userId: 5 } } as any;

    const result = await h.handle(event);
    expect(result.ok).toBe(true);
    expect(crm.scoreLead).toHaveBeenCalledWith(101, 5);
    expect(repo.updateLeadAiScoreEvent).toHaveBeenCalledWith(
      101,
      72,
      'B',
      expect.any(String),
    );
  });

  it('returns an err-Result when scoring fails (does not throw)', async () => {
    const crm = {
      scoreLead: jest.fn().mockResolvedValue({
        ok: false,
        error: { code: 'INTERNAL', message: 'boom' },
      }),
    };
    const repo = makeRepo();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = new AiLeadScoreHandler(crm as any, repo as any);
    const event = { props: { leadId: 9, userId: 1 } } as any;

    const result = await h.handle(event);
    expect(result.ok).toBe(false);
    expect(repo.updateLeadAiScoreEvent).not.toHaveBeenCalled();
  });
});

describe('AiCandidateScreeningHandler', () => {
  it('is defined', () => {
    expect(AiCandidateScreeningHandler).toBeDefined();
  });

  it('updates funnel screening when screening succeeds', async () => {
    const hrAi = {
      screenCandidate: jest.fn().mockResolvedValue({
        ok: true,
        data: {
          score: 81,
          recommendation: 'STRONG_HIRE',
          aiNotes: 'looks solid '.repeat(10),
          productivityCategory: 'HIGH',
        },
      }),
    };
    const repo = {
      updateCandidateFunnelScreening: jest.fn().mockResolvedValue(undefined),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = new AiCandidateScreeningHandler(hrAi as any, repo as any);
    const event = {
      props: { candidateId: 7, funnelId: 42, userId: 3 },
    } as any;

    await h.handle(event);
    expect(hrAi.screenCandidate).toHaveBeenCalledWith(7, 3);
    expect(repo.updateCandidateFunnelScreening).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        screeningScore: '81',
        productivityCategory: 'HIGH',
      }),
    );
  });

  it('swallows downstream errors and does not throw', async () => {
    const hrAi = {
      screenCandidate: jest.fn().mockRejectedValue(new Error('oh no')),
    };
    const repo = { updateCandidateFunnelScreening: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = new AiCandidateScreeningHandler(hrAi as any, repo as any);
    const event = {
      props: { candidateId: 1, funnelId: 1, userId: 1 },
    } as any;

    await expect(h.handle(event)).resolves.toBeUndefined();
    expect(repo.updateCandidateFunnelScreening).not.toHaveBeenCalled();
  });
});

describe('AiInvoiceClassifyHandler', () => {
  it('is defined', () => {
    expect(AiInvoiceClassifyHandler).toBeDefined();
  });

  it('writes the classification fields when analysis succeeds', async () => {
    const analysis = {
      classifyInvoice: jest.fn().mockResolvedValue({
        category: 'OFFICE',
        subcategory: 'STATIONERY',
        taxCode: 'V12',
        confidence: 91,
      }),
    };
    const repo = {
      updateGlDocumentAiCategory: jest.fn().mockResolvedValue(undefined),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = new AiInvoiceClassifyHandler(analysis as any, repo as any);
    const event = {
      props: {
        invoiceId: 33,
        description: 'pens',
        amount: 1000,
        vendor: 'OfficeMax',
        userId: 8,
      },
    } as any;

    await h.handle(event);
    expect(analysis.classifyInvoice).toHaveBeenCalledWith(
      'pens',
      1000,
      'OfficeMax',
      8,
    );
    expect(repo.updateGlDocumentAiCategory).toHaveBeenCalledWith(
      33,
      expect.objectContaining({
        aiCategory: 'OFFICE',
        aiSubcategory: 'STATIONERY',
        aiTaxCode: 'V12',
        aiConfidence: 91,
      }),
    );
  });
});
