/**
 * test/marketing/create-campaign.handler.spec.ts
 * Unit tests for CreateCampaignHandler. The EventBus is mocked; Campaign aggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateCampaignHandler } from '../../src/modules/marketing/application/commands/create-campaign.handler';
import { CreateCampaignCommand } from '../../src/modules/marketing/application/commands/create-campaign.command';
import { CampaignCreatedEvent } from '../../src/modules/marketing/domain/events';
import { campaignFactory } from '../_fixtures/factories';

interface BusMock { publish: jest.Mock }
function makeBus(): BusMock { return { publish: jest.fn() }; }

function makeCmd(over: Partial<{ name: string; type: string; budget: number; createdBy: number }> = {}): CreateCampaignCommand {
  const f = campaignFactory();
  return new CreateCampaignCommand(
    over.name ?? f.name,
    over.type ?? 'email',
    f.description,
    f.targetAudience,
    over.budget ?? f.budget,
    f.startDate,
    f.endDate,
    over.createdBy ?? f.createdBy,
  );
}

describe('CreateCampaignHandler', () => {
  let handler: CreateCampaignHandler;
  let bus: BusMock;

  beforeEach(async () => {
    bus = makeBus();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCampaignHandler,
        { provide: EventBus, useValue: bus },
      ],
    }).compile();
    handler = moduleRef.get(CreateCampaignHandler);
  });

  it('returns Ok with a generated UUID when input is valid', async () => {
    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('publishes CampaignCreatedEvent carrying the new id and name when campaign is created', async () => {
    const r = await handler.execute(makeCmd({ name: 'Spring Promo' }));

    expect(bus.publish).toHaveBeenCalledTimes(1);
    const published = bus.publish.mock.calls[0][0] as CampaignCreatedEvent;
    expect(published).toBeInstanceOf(CampaignCreatedEvent);
    expect(published.name).toBe('Spring Promo');
    if (r.ok) expect(published.campaignId).toBe(r.data);
  });

  it('returns a different UUID on each invocation when called multiple times', async () => {
    const r1 = await handler.execute(makeCmd());
    const r2 = await handler.execute(makeCmd());

    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) expect(r1.data).not.toBe(r2.data);
  });

  it('publishes the event before returning Ok when handler is invoked', async () => {
    let publishedBeforeReturn = false;
    bus.publish.mockImplementation(() => { publishedBeforeReturn = true; });

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    expect(publishedBeforeReturn).toBe(true);
  });
});
