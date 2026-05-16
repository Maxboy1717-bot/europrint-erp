/**
 * crm-ai-extended.service.spec.ts
 *
 * Unit tests for CrmAiExtendedService. The service has no I/O dependencies —
 * it composes deterministic enrichment payloads — but each method exposes
 * specific contract fields callers depend on. These tests pin those.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmAiExtendedService } from '../../src/modules/crm/application/crm-ai-extended.service';

describe('CrmAiExtendedService', () => {
  let svc: CrmAiExtendedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmAiExtendedService],
    }).compile();
    svc = module.get(CrmAiExtendedService);
  });

  it('returns suggestions block with confidence when autofill called', async () => {
    const r = await svc.autofill('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        entity_type: string;
        entity_id: number;
        suggestions: Record<string, string>;
        confidence: number;
      };
      expect(data.entity_type).toBe('lead');
      expect(data.entity_id).toBe(7);
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.suggestions.industry).toBeDefined();
    }
  });

  it('returns medium churn risk envelope when analyzeChurn called', async () => {
    const r = await svc.analyzeChurn('deal', 9);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        churn_risk: string;
        risk_score: number;
        factors: string[];
      };
      expect(data.churn_risk).toBe('medium');
      expect(data.risk_score).toBeGreaterThan(0);
      expect(data.risk_score).toBeLessThanOrEqual(1);
      expect(Array.isArray(data.factors)).toBe(true);
    }
  });

  it('returns 3 ordered tasks when suggestAutoTasks called', async () => {
    const r = await svc.suggestAutoTasks('lead', 7);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        suggested_tasks: Array<{ priority: string; due_in_days: number }>;
      };
      expect(data.suggested_tasks).toHaveLength(3);
      expect(data.suggested_tasks[0].priority).toBe('high');
    }
  });

  it('returns task body in created envelope when createAutoTask called', async () => {
    const body = { title: 'Follow up', due_date: '2026-06-01', assigned_to: 5 };
    const r = await svc.createAutoTask(body);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        created: boolean;
        task: { title: string; assigned_to: number };
        source: string;
      };
      expect(data.created).toBe(true);
      expect(data.task.title).toBe('Follow up');
      expect(data.source).toBe('ai_generated');
    }
  });

  it('echoes message and counts context keys when chatRespond called', async () => {
    const r = await svc.chatRespond('hello', { foo: 1, bar: 2 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as { response: string; context_used: number };
      expect(data.response).toContain('hello');
      expect(data.context_used).toBe(2);
    }
  });

  it('returns positive sentiment + topics when analyzeVoiceCall called', async () => {
    const r = await svc.analyzeVoiceCall({ call_id: 'c-1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        sentiment: string;
        sentiment_score: number;
        topics_discussed: string[];
        action_items: string[];
      };
      expect(data.sentiment).toBe('positive');
      expect(data.sentiment_score).toBeGreaterThan(0);
      expect(data.topics_discussed.length).toBeGreaterThan(0);
      expect(data.action_items.length).toBeGreaterThan(0);
    }
  });

  it('returns quick-score grade B with breakdown factors', async () => {
    const r = await svc.getAiQuickScore('lead', 1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const data = r.data as {
        score: number;
        grade: string;
        factors: Record<string, number>;
      };
      expect(data.grade).toBe('B');
      expect(data.score).toBe(65);
      expect(data.factors.recency).toBeGreaterThan(0);
    }
  });
});
