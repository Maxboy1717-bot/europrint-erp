/**
 * @module applications.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  ApplicationCreateSchema,
  ApplicationUpdateSchema,
  ApplicationResponseCreateSchema,
} from './applications.dto';

describe('ApplicationCreateSchema', () => {
  it('accepts valid application', () => {
    const result = ApplicationCreateSchema.safeParse({
      applicant_name: 'John Doe',
      position_id: 1,
    });
    expect(result.success).toBe(true);
  });

  it('accepts full application with all fields', () => {
    const result = ApplicationCreateSchema.safeParse({
      applicant_name: 'Jane Smith',
      position_id: 3,
      status: 'pending',
      source: 'referral',
      resume_url: 'https://cdn.example.com/resume.pdf',
      cover_letter: 'Dear Hiring Manager...',
      salary_expectation: 5000000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing applicant_name', () => {
    const result = ApplicationCreateSchema.safeParse({ position_id: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects empty applicant_name', () => {
    const result = ApplicationCreateSchema.safeParse({ applicant_name: '', position_id: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects missing position_id', () => {
    const result = ApplicationCreateSchema.safeParse({ applicant_name: 'John' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive position_id', () => {
    const result = ApplicationCreateSchema.safeParse({ applicant_name: 'John', position_id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid resume_url', () => {
    const result = ApplicationCreateSchema.safeParse({
      applicant_name: 'John',
      position_id: 1,
      resume_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('ApplicationUpdateSchema', () => {
  it('accepts all optional fields', () => {
    const result = ApplicationUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts status update', () => {
    const result = ApplicationUpdateSchema.safeParse({ status: 'interviewed' });
    expect(result.success).toBe(true);
  });

  it('accepts interview_date update', () => {
    const result = ApplicationUpdateSchema.safeParse({
      status: 'scheduled',
      interview_date: '2026-02-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects array input', () => {
    const result = ApplicationUpdateSchema.safeParse(['not', 'an', 'object']);
    expect(result.success).toBe(false);
  });
});

describe('ApplicationResponseCreateSchema', () => {
  it('accepts all optional fields', () => {
    const result = ApplicationResponseCreateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full response', () => {
    const result = ApplicationResponseCreateSchema.safeParse({
      application_id: 5,
      response_type: 'interview_feedback',
      notes: 'Good candidate',
      score: 85,
      recommendation: 'hire',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive application_id', () => {
    const result = ApplicationResponseCreateSchema.safeParse({ application_id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects score above 100', () => {
    const result = ApplicationResponseCreateSchema.safeParse({ score: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects negative score', () => {
    const result = ApplicationResponseCreateSchema.safeParse({ score: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects null input', () => {
    const result = ApplicationResponseCreateSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});
