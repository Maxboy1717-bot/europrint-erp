/**
 * test/crm/lead-save.spec.ts
 *
 * Unit test for DrizzleLeadRepository.save() — asserts every column in the
 * insert payload (and the onConflictDoUpdate set clause) is populated with a
 * non-null value derived from the Lead aggregate. Regression coverage for the
 * P0 bug "save() persists only 3 of 9 fields".
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
  crmLeads: { id: 'id' },
}));

import { DrizzleLeadRepository } from '../../src/modules/crm/infrastructure/repositories/drizzle-lead.repo';
import { Lead } from '../../src/modules/crm/domain/aggregates/lead.aggregate';
import { LeadStatus } from '../../src/modules/crm/domain/value-objects/lead-status.vo';
import { AIScore } from '../../src/modules/crm/domain/value-objects/ai-score.vo';
import { Email } from '@shared/domain/value-objects/email.vo';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';

describe('DrizzleLeadRepository.save() — every column persisted', () => {
  let repo: DrizzleLeadRepository;
  let capturedInsert: Record<string, unknown> | null = null;
  let capturedSet: Record<string, unknown> | null = null;

  beforeEach(() => {
    kit.reset();
    capturedInsert = null;
    capturedSet = null;

    // Replace the chainable insert mock with one that captures values()
    // and onConflictDoUpdate({ set }) so we can assert against them.
    kit.db.insert.mockImplementation(() => {
      const chain = {
        values: (v: Record<string, unknown>) => {
          capturedInsert = v;
          return {
            onConflictDoUpdate: (cfg: { target: unknown; set: Record<string, unknown> }) => {
              capturedSet = cfg.set;
              return Promise.resolve(undefined);
            },
          };
        },
      };
      return chain;
    });

    repo = new DrizzleLeadRepository();
  });

  function makeLead(): Lead {
    const statusR = LeadStatus.create('new');
    const aiR = AIScore.create(75);
    const emailR = Email.create('john.doe@example.uz');
    const phoneR = PhoneNumber.create('+998901234567');
    if (!statusR.ok || !aiR.ok || !emailR.ok || !phoneR.ok) throw new Error('test setup');
    return Lead.create({
      companyId: 42,
      firstName: 'John',
      lastName: 'Doe',
      email: emailR.data,
      phone: phoneR.data,
      status: statusR.data,
      aiScore: aiR.data,
      createdBy: 7,
      assignedTo: 3,
      source: 'website',
      notes: 'High-priority lead',
    });
  }

  it('insert payload has every column populated with a non-null value', async () => {
    const lead = makeLead();

    const r = await repo.save(lead);

    expect(r.ok).toBe(true);
    expect(capturedInsert).not.toBeNull();
    const p = capturedInsert as Record<string, unknown>;
    // Every column that the current save() writes should be defined and not null.
    for (const key of [
      'status_description',
      'contact_email',
      'contact_phone',
      'contact_name',
      'source',
      'notes',
      'manager_id',
      'created_at',
      'updated_at',
    ]) {
      expect(p[key]).toBeDefined();
      expect(p[key]).not.toBeNull();
    }
    // Spot-check selected mappings.
    // save() stores the lifecycle status code in status_description
    expect(p.status_description).toBe('new');
    expect(p.contact_email).toBe('john.doe@example.uz');
    expect(p.contact_phone).toBe('+998901234567');
    expect(p.contact_name).toBe('John Doe');
    expect(p.source).toBe('website');
    expect(p.notes).toBe('High-priority lead');
    expect(p.manager_id).toBe(3);
  });

  it('onConflictDoUpdate set clause has every column populated with a non-null value', async () => {
    const lead = makeLead();

    await repo.save(lead);

    expect(capturedSet).not.toBeNull();
    const s = capturedSet as Record<string, unknown>;
    for (const key of [
      'status_description',
      'contact_email',
      'contact_phone',
      'contact_name',
      'source',
      'notes',
      'manager_id',
      'updated_at',
    ]) {
      expect(s[key]).toBeDefined();
      expect(s[key]).not.toBeNull();
    }
  });

  it('falls back to createdBy as manager_id when assignedTo missing', async () => {
    const statusR = LeadStatus.create('new');
    const aiR = AIScore.create(10);
    const emailR = Email.create('a@b.uz');
    const phoneR = PhoneNumber.create('+998900000000');
    if (!statusR.ok || !aiR.ok || !emailR.ok || !phoneR.ok) throw new Error('test setup');
    const lead = Lead.create({
      companyId: 1,
      firstName: 'X',
      lastName: 'Y',
      email: emailR.data,
      phone: phoneR.data,
      status: statusR.data,
      aiScore: aiR.data,
      createdBy: 99,
      source: 'direct',
    });

    await repo.save(lead);

    expect(capturedInsert).not.toBeNull();
    expect((capturedInsert as Record<string, unknown>).manager_id).toBe(99);
  });
});
