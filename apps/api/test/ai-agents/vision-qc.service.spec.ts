/**
 * vision-qc.service.spec.ts — AiVisionQcService auto-execute confidence gate.
 *
 * VISION-3340 #39 (2026-07-08): the AI_AUTO_CONFIDENCE_THRESHOLD hardcoded constant
 * (0.85) was replaced by a runtime read of settings key AI_VISION_QC_AUTO_CONFIDENCE
 * via the shared getConfigNumber() helper (same DB-first/constant-fallback pattern
 * as EP_COST_RATIO/EP_VAT_RATE in delivery-completed.listener.ts). This spec mocks
 * getConfigNumber (no live DB) and asserts:
 *   1. the settings key + default (0.85) are the exact args passed to getConfigNumber
 *   2. a configured threshold from `settings` actually changes autoExecuted/requiresHuman
 *      (proves the gate is no longer hardcoded)
 *   3. an out-of-[0,1]-range configured value falls back to the 0.85 default
 *   4. the cached-decision path (both the "stored" and "action-only" branches) also
 *      uses the runtime threshold, not the old hardcoded constant
 */

const mockGetConfigNumber = jest.fn();
jest.mock('@common/config/business-config.helper', () => ({
  getConfigNumber: (...args: unknown[]) => mockGetConfigNumber(...args),
}));

import { AiVisionQcService } from '../../src/modules/ai-agents/qc/vision-qc.service';
import { Ok } from '../../src/common/result';

function makeSvc(opts: { cached?: unknown } = {}) {
  const call = jest.fn();
  const log = jest.fn(async () => 'decision-hash');
  const hashInput = jest.fn(() => 'input-hash');
  const findCachedDecision = jest.fn(async () => opts.cached ?? null);
  const ai = { call };
  const logSvc = { log, hashInput, findCachedDecision };
  const svc = new AiVisionQcService(ai as never, logSvc as never);
  return { svc, call, log, hashInput, findCachedDecision };
}

const colorTargets = [{ L: 50, a: 0, b: 0 }];

beforeEach(() => {
  mockGetConfigNumber.mockReset();
});

describe('AiVisionQcService.analyze — settings-driven auto-confidence threshold', () => {
  it('reads AI_VISION_QC_AUTO_CONFIDENCE with default 0.85 (exact key/fallback wiring)', async () => {
    mockGetConfigNumber.mockResolvedValueOnce(0.85);
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"deltaE":1.0,"confidence":0.9,"defects":[],"verdict":"PASS"}' }));

    await svc.analyze('WO-1', 'https://img/1.png', colorTargets);

    expect(mockGetConfigNumber).toHaveBeenCalledWith('AI_VISION_QC_AUTO_CONFIDENCE', 0.85);
  });

  it('a HIGHER configured threshold blocks auto-execute that the old hardcoded 0.85 would have allowed', async () => {
    // confidence 0.9 >= hardcoded 0.85 (old behaviour would auto-execute) but < configured 0.95
    mockGetConfigNumber.mockResolvedValueOnce(0.95);
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"deltaE":1.0,"confidence":0.9,"defects":[],"verdict":"PASS"}' }));

    const result = await svc.analyze('WO-2', 'https://img/2.png', colorTargets);

    expect(result.verdict).toBe('PASS');
    expect(result.confidence).toBe(0.9);
    expect(result.autoExecuted).toBe(false);
    expect(result.requiresHuman).toBe(true);
  });

  it('a LOWER configured threshold allows auto-execute that the old hardcoded 0.85 would have blocked', async () => {
    // confidence 0.8 < hardcoded 0.85 (old behaviour would require human) but >= configured 0.7
    mockGetConfigNumber.mockResolvedValueOnce(0.7);
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"deltaE":1.0,"confidence":0.8,"defects":[],"verdict":"PASS"}' }));

    const result = await svc.analyze('WO-3', 'https://img/3.png', colorTargets);

    expect(result.autoExecuted).toBe(true);
    expect(result.requiresHuman).toBe(false);
  });

  it('an out-of-range configured value (>1) falls back to the 0.85 default, never fabricated', async () => {
    mockGetConfigNumber.mockResolvedValueOnce(1.5);
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"deltaE":1.0,"confidence":0.9,"defects":[],"verdict":"PASS"}' }));

    const result = await svc.analyze('WO-4', 'https://img/4.png', colorTargets);

    // 0.9 >= fallback 0.85 -> auto-executed, proving the invalid 1.5 was rejected
    expect(result.autoExecuted).toBe(true);
  });

  it('a negative configured value falls back to the 0.85 default', async () => {
    mockGetConfigNumber.mockResolvedValueOnce(-1);
    const { svc, call } = makeSvc();
    call.mockResolvedValueOnce(Ok({ text: '{"deltaE":1.0,"confidence":0.5,"defects":[],"verdict":"PASS"}' }));

    const result = await svc.analyze('WO-5', 'https://img/5.png', colorTargets);

    // 0.5 < fallback 0.85 -> requires human, proving -1 was rejected (would have auto-executed anything)
    expect(result.autoExecuted).toBe(false);
    expect(result.requiresHuman).toBe(true);
  });

  it('REWORK verdicts always require human review regardless of confidence/threshold', async () => {
    mockGetConfigNumber.mockResolvedValueOnce(0.1);
    const { svc, call } = makeSvc();
    // deltaE=3.5 is between PASS(2.0) and SCRAP(5.0) thresholds -> REWORK
    call.mockResolvedValueOnce(Ok({ text: '{"deltaE":3.5,"confidence":0.99,"defects":["scratch"],"verdict":"REWORK"}' }));

    const result = await svc.analyze('WO-6', 'https://img/6.png', colorTargets);

    expect(result.verdict).toBe('REWORK');
    expect(result.autoExecuted).toBe(false);
    expect(result.requiresHuman).toBe(true);
  });
});

describe('AiVisionQcService.analyze — cached-decision path also uses the runtime threshold', () => {
  it('"stored" branch: cached alternatives[0] carries deltaE/defects/verdict', async () => {
    mockGetConfigNumber.mockResolvedValueOnce(0.95);
    const cached = {
      confidence: 0.9,
      action: 'PASS',
      alternatives: [{ deltaE: 1.2, defects: [], verdict: 'PASS' }],
    };
    const { svc, call } = makeSvc({ cached });

    const result = await svc.analyze('WO-7', 'https://img/7.png', colorTargets);

    expect(call).not.toHaveBeenCalled();
    expect(result.deltaE).toBe(1.2);
    expect(result.confidence).toBe(0.9);
    // 0.9 < configured 0.95 -> blocked, proving the cached branch reads the runtime setting too
    expect(result.autoExecuted).toBe(false);
    expect(result.requiresHuman).toBe(true);
  });

  it('"action-only" branch (no stored alternative shape): still gated by the runtime threshold', async () => {
    mockGetConfigNumber.mockResolvedValueOnce(0.5);
    const cached = { confidence: 0.6, action: 'PASS', alternatives: [] };
    const { svc, call } = makeSvc({ cached });

    const result = await svc.analyze('WO-8', 'https://img/8.png', colorTargets);

    expect(call).not.toHaveBeenCalled();
    // 0.6 >= configured 0.5 -> auto-executed (would have been blocked under old hardcoded 0.85)
    expect(result.autoExecuted).toBe(true);
    expect(result.requiresHuman).toBe(false);
  });
});
