/**
 * @module crm-extended.spec
 * @description Jest / Vitest test suite.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrmContactsController } from '../src/modules/crm/presentation/crm-contacts.controller';
import { CrmLeadsOpsController } from '../src/modules/crm/presentation/crm-leads-ops.controller';
import { CrmActivitiesController } from '../src/modules/crm/presentation/crm-activities.controller';
import { CrmAiController } from '../src/modules/crm/presentation/crm-ai.controller';
import { CrmAutoLeadController } from '../src/modules/crm/presentation/crm-auto-lead.controller';
import { CrmContactsService } from '../src/modules/crm/application/crm-contacts.service';
import { CrmLeadsOpsService } from '../src/modules/crm/application/crm-leads-ops.service';
import { CrmActivitiesService } from '../src/modules/crm/application/crm-activities.service';
import { CrmAiService } from '../src/modules/crm/application/crm-ai.service';
import { CrmAutoLeadService } from '../src/modules/crm/application/crm-auto-lead.service';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

const ok = (data: unknown) => ({ ok: true, data });
const fail = () => ({ ok: false, code: 'DB_ERROR', error: new Error('fail') });

describe('CRM Extended Controllers — Behavioral Integration Tests', () => {
  let contactsController: CrmContactsController;
  let leadsOpsController: CrmLeadsOpsController;
  let activitiesController: CrmActivitiesController;
  let aiController: CrmAiController;
  let autoLeadController: CrmAutoLeadController;

  let mockContactsSvc: jest.Mocked<Partial<CrmContactsService>>;
  let mockLeadsOpsSvc: jest.Mocked<Partial<CrmLeadsOpsService>>;
  let mockActivitiesSvc: jest.Mocked<Partial<CrmActivitiesService>>;
  let mockAiSvc: jest.Mocked<Partial<CrmAiService>>;
  let mockAutoLeadSvc: jest.Mocked<Partial<CrmAutoLeadService>>;
  let commandBusMock: { execute: jest.Mock };

  const mockGuard = { canActivate: () => true };

  beforeEach(async () => {
    mockContactsSvc = {
      listContacts: jest.fn(),
      getContact: jest.fn(),
      createContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      checkDuplicates: jest.fn(),
    };
    mockLeadsOpsSvc = {
      update: jest.fn(),
      updateStage: jest.fn(),
      convert: jest.fn(),
      delete: jest.fn(),
    };
    mockActivitiesSvc = {
      list: jest.fn(),
      today: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      complete: jest.fn(),
      delete: jest.fn(),
    };
    mockAiSvc = {
      analyzeLeadAi: jest.fn(),
      scoreLeadV2: jest.fn(),
      forecastDeal: jest.fn(),
      getDashboardAnalysis: jest.fn(),
      getNextBestAction: jest.fn(),
      suggestAction: jest.fn(),
    };
    mockAutoLeadSvc = {
      quickScore: jest.fn(),
      ingestCallLead: jest.fn(),
      ingestFormLead: jest.fn(),
      ingestTelegramLead: jest.fn(),
      ingestWebsiteLead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        CrmContactsController,
        CrmLeadsOpsController,
        CrmActivitiesController,
        CrmAiController,
        CrmAutoLeadController,
      ],
      providers: [
        { provide: CrmContactsService, useValue: mockContactsSvc },
        { provide: CrmLeadsOpsService, useValue: mockLeadsOpsSvc },
        { provide: CrmActivitiesService, useValue: mockActivitiesSvc },
        { provide: CrmAiService, useValue: mockAiSvc },
        { provide: CrmAutoLeadService, useValue: mockAutoLeadSvc },
        { provide: CommandBus, useValue: (commandBusMock = { execute: jest.fn() }) },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();

    contactsController = module.get(CrmContactsController);
    leadsOpsController = module.get(CrmLeadsOpsController);
    activitiesController = module.get(CrmActivitiesController);
    aiController = module.get(CrmAiController);
    autoLeadController = module.get(CrmAutoLeadController);
  });

  // ─── CrmContactsController ─────────────────────────────────────────────────

  describe('CrmContactsController', () => {
    describe('listContacts()', () => {
      it('returns contacts from service', async () => {
        const contacts = [{ id: 1, first_name: 'Ali', last_name: 'Valiyev', email: 'ali@test.uz' }];
        (mockContactsSvc.listContacts as jest.Mock).mockResolvedValue(ok(contacts));
        const result = await contactsController.listContacts();
        expect(result).toEqual(contacts);
      });

      it('returns empty array when no contacts', async () => {
        (mockContactsSvc.listContacts as jest.Mock).mockResolvedValue(ok([]));
        const result = await contactsController.listContacts();
        expect(result).toEqual([]);
      });
    });

    describe('getContact()', () => {
      it('returns contact when found', async () => {
        const contact = { id: 5, first_name: 'Nodira', last_name: 'Hamidova' };
        (mockContactsSvc.getContact as jest.Mock).mockResolvedValue(ok(contact));
        const result = await contactsController.getContact('5');
        expect(result).toEqual(contact);
      });

      it('throws NotFoundException when contact missing', async () => {
        (mockContactsSvc.getContact as jest.Mock).mockResolvedValue(ok(null));
        await expect(contactsController.getContact('999')).rejects.toThrow(NotFoundException);
      });
    });

    describe('createContact()', () => {
      it('inserts contact and returns created record', async () => {
        const body = { first_name: 'Jasur', last_name: 'Toshmatov', email: 'jasur@test.uz', phone: '+998901234567' };
        const created = { id: 10, ...body };
        (mockContactsSvc.createContact as jest.Mock).mockResolvedValue(ok(created));
        const result = await contactsController.createContact(body);
        expect(result).toEqual(created);
      });

      it('throws BadRequestException when first_name missing', async () => {
        await expect(contactsController.createContact({ last_name: 'Only' })).rejects.toThrow(BadRequestException);
      });
    });

    describe('updateContact()', () => {
      it('updates contact fields', async () => {
        const updated = { id: 5, first_name: 'Updated', email: 'new@test.uz' };
        (mockContactsSvc.updateContact as jest.Mock).mockResolvedValue(ok(updated));
        const result = await contactsController.updateContact('5', { first_name: 'Updated', email: 'new@test.uz' });
        expect(result).toEqual(updated);
      });

      it('throws NotFoundException when contact to update not found', async () => {
        (mockContactsSvc.updateContact as jest.Mock).mockResolvedValue(ok(null));
        await expect(contactsController.updateContact('999', { first_name: 'X' })).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteContact()', () => {
      it('soft-deletes contact and returns success', async () => {
        (mockContactsSvc.deleteContact as jest.Mock).mockResolvedValue(undefined);
        const result = await contactsController.deleteContact('5');
        expect(result).toEqual({ deleted: true, id: 5 });
      });
    });
  });

  // ─── CrmLeadsOpsController ──────────────────────────────────────────────────

  describe('CrmLeadsOpsController', () => {
    describe('update()', () => {
      it('updates and returns lead', async () => {
        const updated = { id: 3, status: 'qualified', assigned_to: 7 };
        commandBusMock.execute.mockResolvedValue(ok(updated));
        const result = await leadsOpsController.update('3', { status: 'qualified', assigned_to: 7 });
        expect(result).toEqual(updated);
      });

      it('throws NotFoundException for missing lead', async () => {
        commandBusMock.execute.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
        await expect(leadsOpsController.update('0', { status: 'lost' })).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateStage()', () => {
      it('updates stage_id and returns lead', async () => {
        const updated = { id: 3, stage_id: 2 };
        commandBusMock.execute.mockResolvedValue(ok(updated));
        const result = await leadsOpsController.updateStage('3', { stage_id: 2 });
        expect(result).toEqual(updated);
      });
    });

    describe('delete()', () => {
      it('returns success: true on delete', async () => {
        commandBusMock.execute.mockResolvedValue(ok({ deleted: true, id: 3 }));
        const result = await leadsOpsController.delete('3');
        expect(result).toEqual({ deleted: true, id: 3 });
      });
    });
  });

  // ─── CrmActivitiesController ───────────────────────────────────────────────

  describe('CrmActivitiesController', () => {
    describe('list()', () => {
      it('returns activities list', async () => {
        const activities = [{ id: 1, type: 'call', subject: 'Initial contact' }];
        (mockActivitiesSvc.list as jest.Mock).mockResolvedValue(ok(activities));
        const result = await activitiesController.list();
        expect(result).toEqual(activities);
      });
    });

    describe('create()', () => {
      it('creates activity and returns record', async () => {
        const body = { type: 'email', subject: 'Follow-up', lead_id: 5, assigned_to: 3 };
        const created = { id: 20, ...body };
        (mockActivitiesSvc.create as jest.Mock).mockResolvedValue(ok(created));
        const result = await activitiesController.create(body);
        expect(result).toEqual(created);
      });

      it('throws BadRequestException when type missing', async () => {
        await expect(activitiesController.create({ subject: 'test' })).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException when subject missing', async () => {
        await expect(activitiesController.create({ type: 'call' })).rejects.toThrow(BadRequestException);
      });
    });

    describe('complete()', () => {
      it('marks activity as completed', async () => {
        const updated = { id: 20, status: 'completed', outcome: 'Interested' };
        (mockActivitiesSvc.complete as jest.Mock).mockResolvedValue(ok(updated));
        const result = await activitiesController.complete('20', { outcome: 'Interested' });
        expect(result).toEqual(updated);
      });

      it('throws NotFoundException when activity not found', async () => {
        (mockActivitiesSvc.complete as jest.Mock).mockResolvedValue(ok(null));
        await expect(activitiesController.complete('999', {})).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ─── CrmAiController ────────────────────────────────────────────────────────

  describe('CrmAiController', () => {
    describe('analyzeLeadAi()', () => {
      it('returns score and analysis for existing lead', async () => {
        const analysis = { score: 72, analysis: { recommendation: 'Call soon' }, insights: [] };
        (mockAiSvc.analyzeLeadAi as jest.Mock).mockResolvedValue(ok(analysis));
        const result = await aiController.analyzeLeadAi('1', {});
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('analysis');
        expect(result.analysis).toHaveProperty('recommendation');
      });

      it('throws NotFoundException for missing lead', async () => {
        (mockAiSvc.analyzeLeadAi as jest.Mock).mockResolvedValue(ok(null));
        await expect(aiController.analyzeLeadAi('0', {})).rejects.toThrow(NotFoundException);
      });
    });

    describe('scoreLeadV2()', () => {
      it('returns score breakdown', async () => {
        const scored = { score: 65, grade: 'B', breakdown: { behavioral: 40, company: 15, activity: 10 } };
        (mockAiSvc.scoreLeadV2 as jest.Mock).mockResolvedValue(ok(scored));
        const result = await aiController.scoreLeadV2('2', {});
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('breakdown');
        expect(result.breakdown).toHaveProperty('behavioral');
        expect(['A', 'B', 'C', 'D']).toContain(result.grade);
      });

      it('throws NotFoundException when lead not found', async () => {
        (mockAiSvc.scoreLeadV2 as jest.Mock).mockResolvedValue(ok(null));
        await expect(aiController.scoreLeadV2('0', {})).rejects.toThrow(NotFoundException);
      });
    });

    describe('forecastDeal()', () => {
      it('returns probability forecast', async () => {
        const forecast = { win_probability: 72, risk_level: 'medium', recommendations: [] };
        (mockAiSvc.forecastDeal as jest.Mock).mockResolvedValue(ok(forecast));
        const result = await aiController.forecastDeal('5', {});
        expect(result).toHaveProperty('win_probability');
        expect(result.win_probability).toBeGreaterThanOrEqual(5);
        expect(result.win_probability).toBeLessThanOrEqual(95);
      });

      it('throws NotFoundException when deal not found', async () => {
        (mockAiSvc.forecastDeal as jest.Mock).mockResolvedValue(ok(null));
        await expect(aiController.forecastDeal('0', {})).rejects.toThrow(NotFoundException);
      });
    });

    describe('getDashboardAnalysis()', () => {
      it('returns leads and deals summary', async () => {
        const leadStats = { total: 50, new_leads: 10, qualified: 20, converted: 5, avg_score: 65 };
        const dealStats = { total: 30, won: 8, pipeline_value: '1500000' };
        (mockAiSvc.getDashboardAnalysis as jest.Mock).mockResolvedValue(ok({ leads: leadStats, deals: dealStats }));
        const result = await aiController.getDashboardAnalysis();
        expect(result).toHaveProperty('leads');
        expect(result).toHaveProperty('deals');
        expect(result.leads).toEqual(leadStats);
      });
    });

    describe('suggestAction()', () => {
      it('returns suggested action with urgency', async () => {
        const suggestion = { suggested_action: 'call', urgency: 'high', days_since_contact: 10 };
        (mockAiSvc.suggestAction as jest.Mock).mockResolvedValue(ok(suggestion));
        const result = await aiController.suggestAction({ lead_id: 1 });
        expect(result).toHaveProperty('suggested_action');
        expect(result).toHaveProperty('urgency');
        expect(result).toHaveProperty('days_since_contact');
      });

      it('throws BadRequestException when neither lead_id nor deal_id provided', async () => {
        await expect(aiController.suggestAction({})).rejects.toThrow(BadRequestException);
      });
    });
  });

  // ─── CrmAutoLeadController ──────────────────────────────────────────────────

  describe('CrmAutoLeadController', () => {
    describe('quickScore()', () => {
      it('returns lead score', async () => {
        (mockAutoLeadSvc.quickScore as jest.Mock).mockResolvedValue(ok({ id: 1, ai_score: 72, status: 'qualified', score: 72, entity_type: 'lead' }));
        const result = await autoLeadController.quickScore('lead', '1');
        expect(result).toHaveProperty('ai_score');
        expect(result.entity_type).toBe('lead');
      });

      it('throws NotFoundException for missing lead in quickScore', async () => {
        (mockAutoLeadSvc.quickScore as jest.Mock).mockResolvedValue(ok(null));
        await expect(autoLeadController.quickScore('lead', '0')).rejects.toThrow(NotFoundException);
      });
    });

    describe('auto-lead ingestion', () => {
      it('ingestCallLead creates lead with source=call', async () => {
        const created = { id: 100, phone: '+998901234567', source: 'call', status: 'new' };
        (mockAutoLeadSvc.ingestCallLead as jest.Mock).mockResolvedValue(ok(created));
        const result = await autoLeadController.ingestCallLead({ phone: '+998901234567', notes: 'Incoming call' });
        expect(result.source).toBe('call');
      });

      it('ingestCallLead throws BadRequestException when phone missing', async () => {
        await expect(autoLeadController.ingestCallLead({ first_name: 'Test' } as any)).rejects.toThrow(BadRequestException);
      });

      it('ingestFormLead creates lead with form source', async () => {
        const created = { id: 101, email: 'form@test.uz', source: 'web_form', status: 'new' };
        (mockAutoLeadSvc.ingestFormLead as jest.Mock).mockResolvedValue(ok(created));
        const result = await autoLeadController.ingestFormLead({ email: 'form@test.uz', form_name: 'web_form' });
        expect(result).toEqual(created);
      });

      it('ingestFormLead throws BadRequestException when no email or phone', async () => {
        await expect(autoLeadController.ingestFormLead({ first_name: 'Only Name' } as any)).rejects.toThrow(BadRequestException);
      });

      it('ingestTelegramLead requires telegram_id', async () => {
        await expect(autoLeadController.ingestTelegramLead({ first_name: 'NoId' } as any)).rejects.toThrow(BadRequestException);
      });

      it('ingestWebsiteLead requires email or phone', async () => {
        await expect(autoLeadController.ingestWebsiteLead({ first_name: 'Visitor' } as any)).rejects.toThrow(BadRequestException);
      });
    });
  });
});
