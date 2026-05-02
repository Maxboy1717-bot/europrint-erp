import { Test, TestingModule } from '@nestjs/testing';
import { MesMaintenanceController } from '../src/modules/mes/presentation/mes-maintenance.controller';
import { MesShiftsStatsController } from '../src/modules/mes/presentation/mes-shifts-stats.controller';
import { QcExtendedController } from '../src/modules/qc/presentation/qc-extended.controller';
import { QcDefectsExtendedController } from '../src/modules/qc/presentation/qc-defects-extended.controller';
import { SdDashboardController } from '../src/modules/sd/presentation/sd-dashboard.controller';
import { SdCustomersController } from '../src/modules/sd/presentation/sd-customers.controller';
import { SdLeadsController } from '../src/modules/sd/presentation/sd-leads.controller';
import { MesMaintenanceService } from '../src/modules/mes/application/mes-maintenance.service';
import { MesShiftsStatsService } from '../src/modules/mes/application/mes-shifts-stats.service';
import { QcExtendedService } from '../src/modules/qc/application/qc-extended.service';
import { QcDefectsExtendedService } from '../src/modules/qc/application/qc-defects-extended.service';
import { SdDashboardService } from '../src/modules/sd/application/sd-dashboard.service';
import { SdCustomersService } from '../src/modules/sd/application/sd-customers.service';
import { SdLeadsService } from '../src/modules/sd/application/sd-leads.service';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const ok = (data: unknown) => ({ ok: true, data });
const mockGuard = { canActivate: () => true };
const adminUser = { id: 1, username: 'admin', role: 'super_admin' };

describe('MES, QC, and SD Extended Controllers — Behavioral Integration Tests', () => {
  let mesMaintenanceCtrl: MesMaintenanceController;
  let mesShiftsCtrl: MesShiftsStatsController;
  let qcExtCtrl: QcExtendedController;
  let qcDefectsCtrl: QcDefectsExtendedController;
  let sdDashCtrl: SdDashboardController;
  let sdCustCtrl: SdCustomersController;
  let sdLeadsCtrl: SdLeadsController;

  let mockMesMaintSvc: jest.Mocked<Partial<MesMaintenanceService>>;
  let mockMesShiftsSvc: jest.Mocked<Partial<MesShiftsStatsService>>;
  let mockQcExtSvc: jest.Mocked<Partial<QcExtendedService>>;
  let mockQcDefectsSvc: jest.Mocked<Partial<QcDefectsExtendedService>>;
  let mockSdDashSvc: jest.Mocked<Partial<SdDashboardService>>;
  let mockSdCustSvc: jest.Mocked<Partial<SdCustomersService>>;
  let mockSdLeadsSvc: jest.Mocked<Partial<SdLeadsService>>;

  beforeEach(async () => {
    mockMesMaintSvc = {
      listMaintenanceRequests: jest.fn(),
      createMaintenanceRequest: jest.fn(),
      updateMaintenanceRequest: jest.fn(),
      listTasks: jest.fn(),
      updateTaskProgress: jest.fn(),
      createSos: jest.fn(),
      getSosHistory: jest.fn(),
      getDowntimeReasons: jest.fn(),
      createDowntimeEvent: jest.fn(),
      getDowntimeEvents: jest.fn(),
    };
    mockMesShiftsSvc = {
      getCurrentShift: jest.fn(),
      shiftHandover: jest.fn(),
      closeShiftEvaluation: jest.fn(),
      getShiftEvaluations: jest.fn(),
      getOee: jest.fn(),
      getGamificationLeaderboard: jest.fn(),
      pauseSession: jest.fn(),
      resumeSession: jest.fn(),
      updateSessionQuantity: jest.fn(),
      recordMaterialConsumption: jest.fn(),
    };
    mockQcExtSvc = {
      listStandards: jest.fn(),
      getStandard: jest.fn(),
      createStandard: jest.fn(),
      updateStandard: jest.fn(),
      listFinalInspections: jest.fn(),
      createFinalInspection: jest.fn(),
      completeFinalInspection: jest.fn(),
      getFinalOrders: jest.fn(),
      listInProcess: jest.fn(),
      createInProcessInspection: jest.fn(),
      listRootCauses: jest.fn(),
      createRootCause: jest.fn(),
    };
    mockQcDefectsSvc = {
      listBraks: jest.fn(),
      createBrak: jest.fn(),
      getBrakStats: jest.fn(),
      getBrakCostImpact: jest.fn(),
      listSupplierQuality: jest.fn(),
      createSupplierQuality: jest.fn(),
      getDashboardStats: jest.fn(),
      getDashboardFlow: jest.fn(),
      listApprovals: jest.fn(),
      createApproval: jest.fn(),
    };
    mockSdDashSvc = {
      getOverview: jest.fn(),
      getManagerActions: jest.fn(),
      getQuotaStats: jest.fn(),
    };
    mockSdCustSvc = {
      list: jest.fn(),
      getById: jest.fn(),
      get360View: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getContacts: jest.fn(),
      addContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      getInteractions: jest.fn(),
      addInteraction: jest.fn(),
      getDocuments: jest.fn(),
      addDocument: jest.fn(),
      getCompetitors: jest.fn(),
      getComplaints: jest.fn(),
    };
    mockSdLeadsSvc = {
      list: jest.fn(),
      getStats: jest.fn(),
      exportLeads: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
      convert: jest.fn(),
      addActivity: jest.fn(),
      getActivities: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        MesMaintenanceController, MesShiftsStatsController,
        QcExtendedController, QcDefectsExtendedController,
        SdDashboardController, SdCustomersController, SdLeadsController,
      ],
      providers: [
        { provide: MesMaintenanceService, useValue: mockMesMaintSvc },
        { provide: MesShiftsStatsService, useValue: mockMesShiftsSvc },
        { provide: QcExtendedService, useValue: mockQcExtSvc },
        { provide: QcDefectsExtendedService, useValue: mockQcDefectsSvc },
        { provide: SdDashboardService, useValue: mockSdDashSvc },
        { provide: SdCustomersService, useValue: mockSdCustSvc },
        { provide: SdLeadsService, useValue: mockSdLeadsSvc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();

    mesMaintenanceCtrl = module.get(MesMaintenanceController);
    mesShiftsCtrl = module.get(MesShiftsStatsController);
    qcExtCtrl = module.get(QcExtendedController);
    qcDefectsCtrl = module.get(QcDefectsExtendedController);
    sdDashCtrl = module.get(SdDashboardController);
    sdCustCtrl = module.get(SdCustomersController);
    sdLeadsCtrl = module.get(SdLeadsController);
  });

  // ─── MES Maintenance ─────────────────────────────────────────────────────────

  describe('MesMaintenanceController', () => {
    it('listMaintenanceRequests() returns list', async () => {
      const requests = [{ id: 1, title: 'Printer jam', status: 'open' }];
      (mockMesMaintSvc.listMaintenanceRequests as jest.Mock).mockResolvedValue(ok(requests));
      expect(await mesMaintenanceCtrl.listMaintenanceRequests()).toEqual(requests);
    });

    it('createMaintenanceRequest() creates and returns record', async () => {
      const body = { title: 'Conveyor belt', machine_id: 5, priority: 'high' };
      const created = { id: 20, ...body, status: 'open' };
      (mockMesMaintSvc.createMaintenanceRequest as jest.Mock).mockResolvedValue(ok([created]));
      expect(await mesMaintenanceCtrl.createMaintenanceRequest(body as any, adminUser)).toEqual(created);
    });

    it('updateMaintenanceRequest() updates status', async () => {
      const updated = { id: 1, status: 'resolved', resolved_at: new Date().toISOString() };
      (mockMesMaintSvc.updateMaintenanceRequest as jest.Mock).mockResolvedValue(ok([updated]));
      expect(await mesMaintenanceCtrl.updateMaintenanceRequest('1', { status: 'resolved' } as any)).toEqual(updated);
    });

    it('updateMaintenanceRequest() throws NotFoundException when not found', async () => {
      (mockMesMaintSvc.updateMaintenanceRequest as jest.Mock).mockResolvedValue(ok(null));
      await expect(mesMaintenanceCtrl.updateMaintenanceRequest('999', { status: 'resolved' } as any)).rejects.toThrow(NotFoundException);
    });

    it('listTasks() returns task list', async () => {
      const tasks = [{ id: 1, session_id: 5, title: 'Print run', status: 'in_progress' }];
      (mockMesMaintSvc.listTasks as jest.Mock).mockResolvedValue(ok(tasks));
      expect(await mesMaintenanceCtrl.listTasks()).toEqual(tasks);
    });

    it('updateTaskProgress() updates progress and returns record', async () => {
      const updated = { id: 3, progress: 75, status: 'in_progress' };
      (mockMesMaintSvc.updateTaskProgress as jest.Mock).mockResolvedValue(ok([updated]));
      expect(await mesMaintenanceCtrl.updateTaskProgress('3', { progress: 75 } as any)).toEqual(updated);
    });

    it('updateTaskProgress() throws NotFoundException when task missing', async () => {
      (mockMesMaintSvc.updateTaskProgress as jest.Mock).mockResolvedValue(ok(null));
      await expect(mesMaintenanceCtrl.updateTaskProgress('999', { progress: 50 } as any)).rejects.toThrow(NotFoundException);
    });

    it('createSos() records emergency signal', async () => {
      const created = { id: 2, machine_id: 5, reported_by: 1, severity: 'critical' };
      (mockMesMaintSvc.createSos as jest.Mock).mockResolvedValue(ok([created]));
      expect(await mesMaintenanceCtrl.createSos({ machine_id: 5, severity: 'critical' } as any, adminUser)).toEqual(created);
    });
  });

  // ─── MES Shifts/Stats ────────────────────────────────────────────────────────

  describe('MesShiftsStatsController', () => {
    it('getCurrentShift() returns shift info', async () => {
      const shift = { id: 7, name: '2-smena', supervisor_id: 2, started_at: '2024-01-01T08:00:00Z' };
      (mockMesShiftsSvc.getCurrentShift as jest.Mock).mockResolvedValue(ok(shift));
      expect(await mesShiftsCtrl.getCurrentShift()).toEqual(shift);
    });

    it('getCurrentShift() returns null when no active shift', async () => {
      (mockMesShiftsSvc.getCurrentShift as jest.Mock).mockResolvedValue(ok(null));
      const result = await mesShiftsCtrl.getCurrentShift();
      expect(result).toBeNull();
    });

    it('getGamificationLeaderboard() returns ranked list', async () => {
      const board = [{ employee_id: 3, name: 'Ali', score: 950, rank: 1 }];
      (mockMesShiftsSvc.getGamificationLeaderboard as jest.Mock).mockResolvedValue(ok(board));
      expect(await mesShiftsCtrl.getGamificationLeaderboard()).toEqual(board);
    });

    it('pauseSession() pauses production session', async () => {
      const updated = { id: 5, status: 'paused', paused_at: new Date().toISOString() };
      (mockMesShiftsSvc.pauseSession as jest.Mock).mockResolvedValue(ok([updated]));
      expect(await mesShiftsCtrl.pauseSession('5', { reason: 'machinery' })).toEqual(updated);
    });

    it('pauseSession() throws NotFoundException when session not found', async () => {
      (mockMesShiftsSvc.pauseSession as jest.Mock).mockResolvedValue(ok(null));
      await expect(mesShiftsCtrl.pauseSession('999', {})).rejects.toThrow(NotFoundException);
    });

    it('resumeSession() resumes paused session', async () => {
      const updated = { id: 5, status: 'active', resumed_at: new Date().toISOString() };
      (mockMesShiftsSvc.resumeSession as jest.Mock).mockResolvedValue(ok([updated]));
      expect(await mesShiftsCtrl.resumeSession('5')).toEqual(updated);
    });

    it('updateSessionQuantity() updates produced count', async () => {
      const updated = { id: 5, produced_quantity: 200, status: 'active' };
      (mockMesShiftsSvc.updateSessionQuantity as jest.Mock).mockResolvedValue(ok([updated]));
      expect(await mesShiftsCtrl.updateSessionQuantity('5', { produced_quantity: 200 } as any)).toEqual(updated);
    });

    it('recordMaterialConsumption() records usage', async () => {
      const created = { id: 9, material_id: 3, quantity: 50, session_id: 5 };
      (mockMesShiftsSvc.recordMaterialConsumption as jest.Mock).mockResolvedValue(ok([created]));
      expect(await mesShiftsCtrl.recordMaterialConsumption({ material_id: 3, quantity: 50, session_id: 5 } as any)).toEqual(created);
    });
  });

  // ─── QC Extended ─────────────────────────────────────────────────────────────

  describe('QcExtendedController', () => {
    it('listStandards() returns quality standards', async () => {
      const standards = [{ id: 1, name: 'ISO-9001', category: 'print', is_active: true }];
      (mockQcExtSvc.listStandards as jest.Mock).mockResolvedValue(ok(standards));
      expect(await qcExtCtrl.listStandards()).toEqual(standards);
    });

    it('createStandard() creates QC standard', async () => {
      const body = { name: 'Offset Print Standard', category: 'print', description: 'Standard desc' };
      const created = { id: 15, ...body, is_active: true };
      (mockQcExtSvc.createStandard as jest.Mock).mockResolvedValue(ok(created));
      expect(await qcExtCtrl.createStandard(body as any)).toEqual(created);
    });

    it('createStandard() throws BadRequestException when name missing', async () => {
      await expect(qcExtCtrl.createStandard({ category: 'print' } as any)).rejects.toThrow(BadRequestException);
    });

    it('listFinalInspections() returns final inspection list', async () => {
      const inspections = [{ id: 1, order_id: 3, status: 'passed', inspector_id: 2 }];
      (mockQcExtSvc.listFinalInspections as jest.Mock).mockResolvedValue(ok(inspections));
      expect(await qcExtCtrl.listFinalInspections()).toEqual(inspections);
    });

    it('createFinalInspection() creates inspection record', async () => {
      const body = { order_id: 3, inspector_id: 2, status: 'pending', notes: 'Check color accuracy' };
      const created = { id: 22, ...body };
      (mockQcExtSvc.createFinalInspection as jest.Mock).mockResolvedValue(ok(created));
      expect(await qcExtCtrl.createFinalInspection(body as any)).toEqual(created);
    });

    it('listInProcess() returns in-process inspections', async () => {
      const items = [{ id: 1, session_id: 5, status: 'in_progress', sample_size: 100 }];
      (mockQcExtSvc.listInProcess as jest.Mock).mockResolvedValue(ok(items));
      expect(await qcExtCtrl.listInProcess()).toEqual(items);
    });

    it('createInProcessInspection() creates inspection', async () => {
      const body = { session_id: 5, sample_size: 100, defects: 0 };
      const created = { id: 30, ...body, status: 'passed' };
      (mockQcExtSvc.createInProcessInspection as jest.Mock).mockResolvedValue(ok(created));
      expect(await qcExtCtrl.createInProcessInspection(body as any)).toEqual(created);
    });

    it('listRootCauses() returns defect root causes', async () => {
      const causes = [{ id: 1, name: 'Reagent holati', category: 'material' }];
      (mockQcExtSvc.listRootCauses as jest.Mock).mockResolvedValue(ok(causes));
      expect(await qcExtCtrl.listRootCauses()).toEqual(causes);
    });
  });

  // ─── QC Defects Extended ─────────────────────────────────────────────────────

  describe('QcDefectsExtendedController', () => {
    it('listBraks() returns brak/defect list', async () => {
      const braks = [{ id: 1, session_id: 3, material_id: 5, quantity: 10, reason: 'Printing error' }];
      (mockQcDefectsSvc.listBraks as jest.Mock).mockResolvedValue(ok(braks));
      expect(await qcDefectsCtrl.listBraks()).toEqual(braks);
    });

    it('createBrak() creates brak record', async () => {
      const body = { session_id: 3, material_id: 5, quantity: 10, reason: 'Mis-align', root_cause_id: 2 };
      const created = { id: 45, ...body };
      (mockQcDefectsSvc.createBrak as jest.Mock).mockResolvedValue(ok(created));
      expect(await qcDefectsCtrl.createBrak(body as any)).toEqual(created);
    });

    it('createBrak() throws BadRequestException when quantity missing', async () => {
      await expect(qcDefectsCtrl.createBrak({ session_id: 3, reason: 'Test' } as any)).rejects.toThrow(BadRequestException);
    });

    it('listSupplierQuality() returns supplier quality assessments', async () => {
      const assessments = [{ id: 1, vendor_id: 5, sample_size: 200, defects_found: 3, status: 'accepted' }];
      (mockQcDefectsSvc.listSupplierQuality as jest.Mock).mockResolvedValue(ok(assessments));
      expect(await qcDefectsCtrl.listSupplierQuality()).toEqual(assessments);
    });

    it('getDashboardStats() returns quality metrics', async () => {
      const stats = { total_braks: 50, total_passed: 950, defect_rate: 5.0 };
      (mockQcDefectsSvc.getDashboardStats as jest.Mock).mockResolvedValue(ok(stats));
      expect(await qcDefectsCtrl.getDashboardStats()).toBeDefined();
    });

    it('listApprovals() returns quality approvals list', async () => {
      const approvals = [{ id: 1, type: 'material', status: 'pending', approver_id: 2 }];
      (mockQcDefectsSvc.listApprovals as jest.Mock).mockResolvedValue(ok(approvals));
      expect(await qcDefectsCtrl.listApprovals()).toEqual(approvals);
    });
  });

  // ─── SD Dashboard ─────────────────────────────────────────────────────────────

  describe('SdDashboardController', () => {
    it('getOverview() returns sales dashboard overview', async () => {
      const overview = { total_orders: 120, revenue: 50000000, active_leads: 35 };
      (mockSdDashSvc.getOverview as jest.Mock).mockResolvedValue(ok(overview));
      expect(await sdDashCtrl.getOverview()).toBeDefined();
    });

    it('getManagerActions() returns pending manager tasks', async () => {
      const actions = [{ id: 1, type: 'call_lead', lead_id: 7, due_in_hours: 2 }];
      (mockSdDashSvc.getManagerActions as jest.Mock).mockResolvedValue(ok(actions));
      expect(await sdDashCtrl.getManagerActions()).toEqual(actions);
    });

    it('getQuotaStats() returns quota performance stats', async () => {
      const stats = { achieved: 75, target: 100, percentage: 75 };
      (mockSdDashSvc.getQuotaStats as jest.Mock).mockResolvedValue(ok(stats));
      expect(await sdDashCtrl.getQuotaStats()).toBeDefined();
    });
  });

  // ─── SD Customers ─────────────────────────────────────────────────────────────

  describe('SdCustomersController', () => {
    it('list() returns customers', async () => {
      const customers = [{ id: 1, name: 'Hamkor Print', status: 'active' }];
      (mockSdCustSvc.list as jest.Mock).mockResolvedValue(ok(customers));
      expect(await sdCustCtrl.list()).toEqual(customers);
    });

    it('getById() returns single customer', async () => {
      const customer = { id: 3, name: 'Polygon Print', status: 'active' };
      (mockSdCustSvc.getById as jest.Mock).mockResolvedValue(ok([customer]));
      const result = await sdCustCtrl.getById('3');
      expect(result).toEqual(customer);
    });

    it('getById() throws NotFoundException when missing', async () => {
      (mockSdCustSvc.getById as jest.Mock).mockResolvedValue(ok(null));
      await expect(sdCustCtrl.getById('999')).rejects.toThrow(NotFoundException);
    });

    it('get360View() returns enriched customer profile', async () => {
      const view = { customer: { id: 3 }, orders: [], leads: [] };
      (mockSdCustSvc.get360View as jest.Mock).mockResolvedValue(ok(view));
      expect(await sdCustCtrl.get360View('3')).toBeDefined();
    });

    it('create() throws ForbiddenException as per business rule', async () => {
      await expect(sdCustCtrl.create()).rejects.toThrow(ForbiddenException);
    });

    it('getContacts() returns customer contacts', async () => {
      const contacts = [{ id: 1, customer_id: 3, full_name: 'Jamshid Toshev', is_primary: true }];
      (mockSdCustSvc.getContacts as jest.Mock).mockResolvedValue(ok(contacts));
      expect(await sdCustCtrl.getContacts('3')).toEqual(contacts);
    });

    it('addContact() creates customer contact', async () => {
      const body = { full_name: 'Barno Yusupova', phone: '+998901112233', email: 'b@y.uz', position: 'Director', is_primary: false };
      const created = { id: 10, customer_id: 3, ...body };
      (mockSdCustSvc.addContact as jest.Mock).mockResolvedValue(ok(created));
      expect(await sdCustCtrl.addContact('3', body as any)).toEqual(created);
    });

    it('getInteractions() returns interaction log', async () => {
      const interactions = [{ id: 1, customer_id: 3, type: 'call', notes: 'Discussed pricing' }];
      (mockSdCustSvc.getInteractions as jest.Mock).mockResolvedValue(ok(interactions));
      expect(await sdCustCtrl.getInteractions('3')).toEqual(interactions);
    });
  });

  // ─── SD Leads ─────────────────────────────────────────────────────────────────

  describe('SdLeadsController', () => {
    it('list() returns leads with pagination', async () => {
      const leads = [{ id: 1, full_name: 'Nodira Bekova', status: 'new', assigned_to: 2 }];
      (mockSdLeadsSvc.list as jest.Mock).mockResolvedValue(ok(leads));
      expect(await sdLeadsCtrl.list()).toEqual(leads);
    });

    it('getStats() returns lead statistics', async () => {
      const stats = { total: 100, converted: 30, new: 40, in_progress: 30 };
      (mockSdLeadsSvc.getStats as jest.Mock).mockResolvedValue(ok(stats));
      expect(await sdLeadsCtrl.getStats()).toBeDefined();
    });

    it('getById() returns lead detail', async () => {
      const lead = { id: 5, full_name: 'Timur Karimov', status: 'contacted' };
      (mockSdLeadsSvc.getById as jest.Mock).mockResolvedValue(ok([lead]));
      const result = await sdLeadsCtrl.getById('5');
      expect(result).toEqual(lead);
    });

    it('getById() throws NotFoundException when missing', async () => {
      (mockSdLeadsSvc.getById as jest.Mock).mockResolvedValue(ok(null));
      await expect(sdLeadsCtrl.getById('999')).rejects.toThrow(NotFoundException);
    });

    it('create() creates new lead', async () => {
      const body = { full_name: 'Kamola Mirzaeva', phone: '+998991234567', source: 'website' };
      const created = { id: 50, ...body, status: 'new' };
      (mockSdLeadsSvc.create as jest.Mock).mockResolvedValue(ok(created));
      expect(await sdLeadsCtrl.create(body as any)).toEqual(created);
    });

    it('create() throws BadRequestException when full_name missing', async () => {
      await expect(sdLeadsCtrl.create({ phone: '+998991234567' } as any)).rejects.toThrow(BadRequestException);
    });

    it('updateStatus() changes lead status', async () => {
      const updated = { id: 5, status: 'converted' };
      (mockSdLeadsSvc.updateStatus as jest.Mock).mockResolvedValue(ok([updated]));
      expect(await sdLeadsCtrl.updateStatus('5', { status: 'converted' })).toEqual(updated);
    });

    it('updateStatus() throws NotFoundException when lead missing', async () => {
      (mockSdLeadsSvc.updateStatus as jest.Mock).mockResolvedValue(ok(null));
      await expect(sdLeadsCtrl.updateStatus('999', { status: 'lost' })).rejects.toThrow(NotFoundException);
    });

    it('delete() removes lead', async () => {
      (mockSdLeadsSvc.delete as jest.Mock).mockResolvedValue(undefined);
      expect(await sdLeadsCtrl.delete('5')).toEqual({ success: true });
    });

    it('convert() converts lead to customer', async () => {
      const result = { id: 5, converted_to_customer_id: 100, status: 'converted' };
      (mockSdLeadsSvc.convert as jest.Mock).mockResolvedValue(ok(result));
      expect(await sdLeadsCtrl.convert('5', {} as any)).toBeDefined();
    });

    it('addActivity() logs lead activity', async () => {
      const activity = { id: 3, lead_id: 5, type: 'call', subject: 'Follow up' };
      (mockSdLeadsSvc.addActivity as jest.Mock).mockResolvedValue(ok(activity));
      expect(await sdLeadsCtrl.addActivity('5', { type: 'call', subject: 'Follow up' } as any)).toEqual(activity);
    });

    it('getActivities() returns lead activities', async () => {
      const activities = [{ id: 3, lead_id: 5, type: 'email', subject: 'Introduction' }];
      (mockSdLeadsSvc.getActivities as jest.Mock).mockResolvedValue(ok(activities));
      expect(await sdLeadsCtrl.getActivities('5')).toEqual(activities);
    });
  });
});
