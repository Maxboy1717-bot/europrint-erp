/**
 * @module ai-hr.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  AiHrClassifyProductivityDtoSchema,
  AiHrInterviewQuestionsDtoSchema,
  AiHrAnalyzeToolTestDtoSchema,
  AiHrOnboardingPlanDtoSchema,
  AiHrPerformanceReviewDtoSchema,
} from './ai-hr.dto';

describe('AiHrClassifyProductivityDtoSchema', () => {
  it('accepts valid candidateId and interviewNotes', () => {
    const result = AiHrClassifyProductivityDtoSchema.safeParse({ candidateId: 1, interviewNotes: 'Good candidate' });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive candidateId', () => {
    const result = AiHrClassifyProductivityDtoSchema.safeParse({ candidateId: 0, interviewNotes: 'Notes' });
    expect(result.success).toBe(false);
  });

  it('rejects empty interviewNotes', () => {
    const result = AiHrClassifyProductivityDtoSchema.safeParse({ candidateId: 1, interviewNotes: '' });
    expect(result.success).toBe(false);
  });

  it('rejects interviewNotes exceeding 10000 chars', () => {
    const result = AiHrClassifyProductivityDtoSchema.safeParse({
      candidateId: 1,
      interviewNotes: 'a'.repeat(10_001),
    });
    expect(result.success).toBe(false);
  });
});

describe('AiHrInterviewQuestionsDtoSchema', () => {
  const valid = { positionTitle: 'Software Engineer', candidateBackground: '5 years React experience' };

  it('accepts valid input', () => {
    const result = AiHrInterviewQuestionsDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty positionTitle', () => {
    const result = AiHrInterviewQuestionsDtoSchema.safeParse({ ...valid, positionTitle: '' });
    expect(result.success).toBe(false);
  });

  it('rejects positionTitle over 200 chars', () => {
    const result = AiHrInterviewQuestionsDtoSchema.safeParse({ ...valid, positionTitle: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('AiHrAnalyzeToolTestDtoSchema', () => {
  it('accepts valid positionTitle', () => {
    const result = AiHrAnalyzeToolTestDtoSchema.safeParse({ positionTitle: 'Designer' });
    expect(result.success).toBe(true);
  });

  it('rejects missing positionTitle', () => {
    const result = AiHrAnalyzeToolTestDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('AiHrOnboardingPlanDtoSchema', () => {
  const valid = { positionTitle: 'PM', department: 'Product', employeeName: 'Alisher' };

  it('accepts valid input', () => {
    const result = AiHrOnboardingPlanDtoSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty employeeName', () => {
    const result = AiHrOnboardingPlanDtoSchema.safeParse({ ...valid, employeeName: '' });
    expect(result.success).toBe(false);
  });
});

describe('AiHrPerformanceReviewDtoSchema', () => {
  it('accepts valid period and kpiData', () => {
    const result = AiHrPerformanceReviewDtoSchema.safeParse({ period: '2024-Q1', kpiData: { sales: 100 } });
    expect(result.success).toBe(true);
  });

  it('rejects missing kpiData', () => {
    const result = AiHrPerformanceReviewDtoSchema.safeParse({ period: '2024-Q1' });
    expect(result.success).toBe(false);
  });

  it('rejects empty period', () => {
    const result = AiHrPerformanceReviewDtoSchema.safeParse({ period: '', kpiData: {} });
    expect(result.success).toBe(false);
  });
});
