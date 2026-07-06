/**
 * @module misc-extended.spec
 * @description Jest / Vitest test suite.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OkrController } from '../src/modules/director/presentation/okr.controller';
import { KaizenController } from '../src/modules/director/presentation/kaizen.controller';
import { StrategicController } from '../src/modules/director/presentation/strategic.controller';
import { CoordinationController } from '../src/modules/director/presentation/coordination.controller';
import { ZvsController } from '../src/modules/director/presentation/zvs.controller';
import { ZnoController } from '../src/modules/director/presentation/zno.controller';
import { IotCameraController } from '../src/modules/iot/presentation/iot-camera.controller';
import { CameraAiController } from '../src/modules/iot/presentation/camera-ai.controller';
import { RaciController } from '../src/modules/security/presentation/raci.controller';
import { OkrService } from '../src/modules/director/application/okr.service';
import { KaizenService } from '../src/modules/director/application/kaizen.service';
import { StrategicService } from '../src/modules/director/application/strategic.service';
import { CoordinationService } from '../src/modules/director/application/coordination.service';
import { ZvsService } from '../src/modules/director/application/zvs.service';
import { ZnoService } from '../src/modules/director/application/zno.service';
import { IotCameraService } from '../src/modules/iot/application/iot-camera.service';
import { CameraAiService } from '../src/modules/iot/application/camera-ai.service';
import { RaciService } from '../src/modules/security/application/raci.service';
import { JwtAuthGuard } from 'shared/guards/jwt-auth.guard';
import { RolesGuard } from 'shared/guards/roles.guard';
import { I18nService } from 'nestjs-i18n';
const mockI18n = { t: jest.fn((key: string) => key) };

const ok = (data: unknown) => ({ ok: true, data });
const forbidden = (msg = 'Forbidden') => ({ ok: false, error: { code: 'FORBIDDEN', message: msg } });
const badRequest = (msg = 'Bad Request') => ({ ok: false, error: { code: 'BAD_REQUEST', message: msg } });

const adminUser = { id: 1, username: 'admin', role: 'super_admin' };
const mockGuard = { canActivate: () => true };

// ─── OKR ────────────────────────────────────────────────────────────────────

describe('OkrController', () => {
  let ctrl: OkrController;
  let mockSvc: jest.Mocked<Partial<OkrService>>;

  beforeEach(async () => {
    mockSvc = {
      listObjectives: jest.fn(),
      getObjective: jest.fn(),
      createObjective: jest.fn(),
      getDashboard: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OkrController],
      providers: [{ provide: OkrService, useValue: mockSvc }],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(OkrController);
  });

  describe('listObjectives()', () => {
    it('returns objectives list', async () => {
      const objs = [{ id: 1, title: 'Sotishni oshirish', status: 'active' }];
      (mockSvc.listObjectives as jest.Mock).mockResolvedValue(ok(objs));
      const result = await ctrl.listObjectives();
      expect(result).toEqual(objs);
    });
  });

  describe('createObjective()', () => {
    it('throws BadRequestException when title missing', async () => {
      await expect(ctrl.createObjective({ year: '2026' }, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('creates objective when title provided', async () => {
      const created = { id: 1, title: 'Sifatni yaxshilash', status: 'active' };
      (mockSvc.createObjective as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createObjective({ title: 'Sifatni yaxshilash', type: 'company', year: '2026', quarter: 'Q1' }, adminUser);
      expect(result).toEqual(created);
    });
  });

  describe('getOkrDashboard()', () => {
    it('returns dashboard summary', async () => {
      const dash = { objectives: { status: 'active', cnt: 3 }, keyResults: { avg_progress: 65, total: 10 } };
      (mockSvc.getDashboard as jest.Mock).mockResolvedValue(ok(dash));
      const result = await ctrl.getDashboard();
      expect(result).toHaveProperty('objectives');
      expect(result).toHaveProperty('keyResults');
    });
  });
});

// ─── Kaizen ──────────────────────────────────────────────────────────────────

describe('KaizenController', () => {
  let ctrl: KaizenController;
  let mockSvc: jest.Mocked<Partial<KaizenService>>;

  beforeEach(async () => {
    mockSvc = {
      createSuggestion: jest.fn(),
      listSuggestions: jest.fn(),
      getStats: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KaizenController],
      providers: [{ provide: KaizenService, useValue: mockSvc }],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(KaizenController);
  });

  describe('createSuggestion()', () => {
    it('throws BadRequestException when title or description missing', async () => {
      await expect(ctrl.createSuggestion({ title: 'only title' }, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('creates suggestion when all required fields provided', async () => {
      const created = { id: 5, title: 'Energiya tejash', status: 'submitted' };
      (mockSvc.createSuggestion as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createSuggestion(
        { title: 'Energiya tejash', description: "LED chiroqlar o'rnatish", category: 'energy' },
        adminUser,
      );
      expect(result).toEqual(created);
    });
  });

  describe('listSuggestions()', () => {
    it('returns suggestions list', async () => {
      const suggestions = [{ id: 1, title: 'Test', status: 'submitted' }];
      (mockSvc.listSuggestions as jest.Mock).mockResolvedValue(ok(suggestions));
      const result = await ctrl.listSuggestions();
      expect(result).toEqual(suggestions);
    });
  });

  describe('getStats()', () => {
    it('returns kaizen stats', async () => {
      const stats = { total: 10, submitted: 3, in_review: 2, approved: 4, implemented: 1, rejected: 0 };
      (mockSvc.getStats as jest.Mock).mockResolvedValue(ok(stats));
      const result = await ctrl.getStats();
      expect(result).toEqual(stats);
    });
  });
});

// ─── Strategic ────────────────────────────────────────────────────────────────

describe('StrategicController', () => {
  let ctrl: StrategicController;
  let mockSvc: jest.Mocked<Partial<StrategicService>>;

  beforeEach(async () => {
    mockSvc = {
      listTasks: jest.fn(),
      createTask: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrategicController],
      providers: [
        { provide: StrategicService, useValue: mockSvc },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(StrategicController);
  });

  describe('listTasks()', () => {
    it('returns strategic tasks', async () => {
      const tasks = [{ id: 1, title: 'Bozorni kengaytirish', status: 'pending' }];
      (mockSvc.listTasks as jest.Mock).mockResolvedValue(ok(tasks));
      const result = await ctrl.listTasks();
      expect(result).toEqual(tasks);
    });
  });

  describe('createTask()', () => {
    it('throws BadRequestException when title missing', async () => {
      await expect(ctrl.createTask({}, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('creates task with valid data', async () => {
      const created = { id: 2, title: "Eksport yo'nalishlari", status: 'pending' };
      (mockSvc.createTask as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createTask({ title: "Eksport yo'nalishlari", priority: 'high' }, adminUser);
      expect(result).toEqual(created);
    });
  });
});

// ─── Coordination ─────────────────────────────────────────────────────────────

describe('CoordinationController', () => {
  let ctrl: CoordinationController;
  let mockSvc: jest.Mocked<Partial<CoordinationService>>;

  beforeEach(async () => {
    mockSvc = {
      createDoklaWithValidation: jest.fn(),
      listDokla: jest.fn(),
      deleteDoklaWithAuth: jest.fn(),
      deleteRaspWithAuth: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoordinationController],
      providers: [{ provide: CoordinationService, useValue: mockSvc }],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(CoordinationController);
  });

  describe('getCouncils()', () => {
    it('returns 5 councils', () => {
      const result = ctrl.getCouncils();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });
  });

  describe('createDokla()', () => {
    it('throws BadRequestException when title missing', async () => {
      (mockSvc.createDoklaWithValidation as jest.Mock).mockResolvedValue(badRequest('title majburiy'));
      await expect(ctrl.createDokla({ content: 'some content' }, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('creates dokla with valid data', async () => {
      const created = { id: 1, subject: 'Haftalik hisobot', status: 'sent' };
      (mockSvc.createDoklaWithValidation as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createDokla({ title: 'Haftalik hisobot', content: 'test' }, adminUser);
      expect(result).toEqual(created);
    });
  });

  describe('deleteDokla() — ownership check', () => {
    it('allows admin to delete any dokla', async () => {
      (mockSvc.deleteDoklaWithAuth as jest.Mock).mockResolvedValue(ok({ message: "O'chirildi" }));
      const result = await ctrl.deleteDokla('5', adminUser);
      expect(result).toMatchObject({ message: expect.stringContaining("O'chirildi") });
    });

    it('throws ForbiddenException when non-owner non-admin tries to delete', async () => {
      (mockSvc.deleteDoklaWithAuth as jest.Mock).mockResolvedValue(forbidden("SoD: faqat egasi o'chira oladi"));
      const limitedUser = { id: 2, username: 'user2', role: 'employee' };
      await expect(ctrl.deleteDokla('5', limitedUser)).rejects.toThrow(ForbiddenException);
    });

    it('allows owner to delete their own dokla', async () => {
      (mockSvc.deleteDoklaWithAuth as jest.Mock).mockResolvedValue(ok({ message: "O'chirildi" }));
      const result = await ctrl.deleteDokla('5', adminUser);
      expect(result).toMatchObject({ message: expect.stringContaining("O'chirildi") });
    });
  });

  describe('deleteRasporyazhenie() — ownership check', () => {
    it('throws ForbiddenException when non-issuer non-admin tries to delete', async () => {
      (mockSvc.deleteRaspWithAuth as jest.Mock).mockResolvedValue(forbidden("Ruxsat yo'q"));
      const limitedUser = { id: 2, username: 'user2', role: 'employee' };
      await expect(ctrl.deleteRasporyazhenie('3', limitedUser)).rejects.toThrow(ForbiddenException);
    });
  });
});

// ─── ZVS ─────────────────────────────────────────────────────────────────────

describe('ZvsController', () => {
  let ctrl: ZvsController;
  let mockSvc: jest.Mocked<Partial<ZvsService>>;

  beforeEach(async () => {
    mockSvc = {
      createZvsWithValidation: jest.fn(),
      listZvs: jest.fn(),
      approveZvsWithAuth: jest.fn(),
      rejectZvsWithAuth: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZvsController],
      providers: [{ provide: ZvsService, useValue: mockSvc }],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(ZvsController);
  });

  describe('createZvs()', () => {
    it('throws BadRequestException when purpose or amount missing', async () => {
      (mockSvc.createZvsWithValidation as jest.Mock).mockResolvedValue(badRequest('purpose va amount majburiy'));
      await expect(ctrl.createZvs({ purpose: 'test' }, adminUser)).rejects.toThrow(BadRequestException);
      (mockSvc.createZvsWithValidation as jest.Mock).mockResolvedValue(badRequest('purpose va amount majburiy'));
      await expect(ctrl.createZvs({ amount: 1000 }, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('creates ZVS request with valid data', async () => {
      const created = { id: 10, amount: 250000, purpose: 'Qogoz xaridi', level: 1, status: 'pending' };
      (mockSvc.createZvsWithValidation as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createZvs({ amount: 250000, purpose: 'Qogoz xaridi' }, adminUser);
      expect(result).toEqual(created);
    });
  });

  describe('approve()', () => {
    it('throws ForbiddenException when role cannot approve this level', async () => {
      (mockSvc.approveZvsWithAuth as jest.Mock).mockResolvedValue(
        forbidden("ZVS darajasi 3: Direktor yoki CEO (>5M) talab qilinadi. Sizning rolingiz: manager"),
      );
      const limitedUser = { id: 2, username: 'manager', role: 'manager' };
      await expect(ctrl.approve('5', {}, limitedUser)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException (SoD) when submitter tries to approve own ZVS', async () => {
      (mockSvc.approveZvsWithAuth as jest.Mock).mockResolvedValue(
        forbidden("SoD ihlol: ZVS yaratuvchi uni tasdiqlay olmaydi (code: ZVS_SOD_001)"),
      );
      await expect(ctrl.approve('4', {}, adminUser)).rejects.toThrow(ForbiddenException);
    });

    it('approves ZVS when user has required role and is not submitter', async () => {
      const approved = { id: 3, amount: 100000, level: 1, submitted_by: 99, status: 'approved' };
      (mockSvc.approveZvsWithAuth as jest.Mock).mockResolvedValue(ok(approved));
      const result = await ctrl.approve('3', { comment: 'OK' }, adminUser);
      expect(result).toEqual(approved);
    });
  });

  describe('reject()', () => {
    it('throws ForbiddenException (SoD) when submitter tries to reject own ZVS', async () => {
      (mockSvc.rejectZvsWithAuth as jest.Mock).mockResolvedValue(forbidden("SoD ihlol: ZVS yaratuvchi uni rad eta olmaydi"));
      await expect(ctrl.reject('6', { comment: 'test' }, adminUser)).rejects.toThrow(ForbiddenException);
    });
  });
});

// ─── ZNO ─────────────────────────────────────────────────────────────────────

describe('ZnoController', () => {
  let ctrl: ZnoController;
  let mockSvc: jest.Mocked<Partial<ZnoService>>;

  beforeEach(async () => {
    mockSvc = {
      createZnoWithValidation: jest.fn(),
      listZno: jest.fn(),
      approveZnoWithAuth: jest.fn(),
      rejectZnoWithAuth: jest.fn(),
      updateZnoWithAuth: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZnoController],
      providers: [{ provide: ZnoService, useValue: mockSvc }],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(ZnoController);
  });

  describe('createZno()', () => {
    it('throws BadRequestException when purpose or amount missing', async () => {
      (mockSvc.createZnoWithValidation as jest.Mock).mockResolvedValue(badRequest('amount va purpose majburiy'));
      await expect(ctrl.createZno({ purpose: 'test' }, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('creates ZNO request with valid data', async () => {
      const created = { id: 7, amount: 500000, purpose: "To'lov", status: 'pending' };
      (mockSvc.createZnoWithValidation as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createZno({ amount: 500000, purpose: "To'lov" }, adminUser);
      expect(result).toEqual(created);
    });
  });

  describe('approveZno() — role + SoD enforcement', () => {
    it('throws ForbiddenException (SoD) when submitter approves own ZNO', async () => {
      (mockSvc.approveZnoWithAuth as jest.Mock).mockResolvedValue(forbidden("SoD: ZNO yaratuvchi uni tasdiqlay olmaydi"));
      await expect(ctrl.approveZno('3', {}, adminUser)).rejects.toThrow(ForbiddenException);
    });

    it('approves ZNO when different user with finance role', async () => {
      const financeUser = { id: 5, username: 'finance', role: 'finance_manager' };
      const approved = { id: 4, submitted_by: 2, status: 'approved' };
      (mockSvc.approveZnoWithAuth as jest.Mock).mockResolvedValue(ok(approved));
      const result = await ctrl.approveZno('4', { comment: 'OK' }, financeUser);
      expect(result).toEqual(approved);
    });
  });

  describe('rejectZno() — SoD enforcement', () => {
    it('throws ForbiddenException (SoD) when submitter rejects own ZNO', async () => {
      (mockSvc.rejectZnoWithAuth as jest.Mock).mockResolvedValue(forbidden("SoD: ZNO yaratuvchi uni rad eta olmaydi"));
      await expect(ctrl.rejectZno('8', {}, adminUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateZno() — status validation', () => {
    it('throws BadRequestException for invalid status', async () => {
      (mockSvc.updateZnoWithAuth as jest.Mock).mockResolvedValue(badRequest("Noto'g'ri status: invalid_status"));
      await expect(ctrl.updateZno('9', { status: 'invalid_status' }, adminUser)).rejects.toThrow(BadRequestException);
    });
  });
});

// ─── Camera ───────────────────────────────────────────────────────────────────

describe('IotCameraController', () => {
  let ctrl: IotCameraController;
  let mockSvc: jest.Mocked<Partial<IotCameraService>>;

  beforeEach(async () => {
    mockSvc = {
      listCameras: jest.fn(),
      getCamera: jest.fn(),
      createCamera: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IotCameraController],
      providers: [
        { provide: IotCameraService, useValue: mockSvc },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(IotCameraController);
  });

  describe('listCameras()', () => {
    it('returns cameras list', async () => {
      const cameras = [{ id: 1, name: 'Production Floor A', status: 'active' }];
      (mockSvc.listCameras as jest.Mock).mockResolvedValue(ok(cameras));
      const result = await ctrl.listCameras();
      expect(result).toEqual(cameras);
    });
  });

  describe('createCamera()', () => {
    it('throws BadRequestException when name missing', async () => {
      await expect(ctrl.createCamera({ location: 'Floor A' })).rejects.toThrow(BadRequestException);
    });

    it('creates camera with valid data', async () => {
      const created = { id: 2, name: 'Entry Camera', status: 'active' };
      (mockSvc.createCamera as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createCamera({ name: 'Entry Camera', location: 'Main Gate' });
      expect(result).toEqual(created);
    });
  });
});

// ─── Camera AI ────────────────────────────────────────────────────────────────

describe('CameraAiController', () => {
  let ctrl: CameraAiController;
  let mockSvc: jest.Mocked<Partial<CameraAiService>>;

  beforeEach(async () => {
    mockSvc = {
      getSummary: jest.fn(),
      getQualityAnalysis: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CameraAiController],
      providers: [{ provide: CameraAiService, useValue: mockSvc }],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(CameraAiController);
  });

  describe('getSummary()', () => {
    it('returns camera summary stats', async () => {
      const summary = { active_cameras: 5, open_violations: 2, open_defects: 1, open_events: 3 };
      (mockSvc.getSummary as jest.Mock).mockResolvedValue(ok(summary));
      const result = await ctrl.getSummary();
      expect(result).toEqual(summary);
    });
  });

  describe('getQualityAnalysis()', () => {
    it('returns quality analysis data', async () => {
      const analysis = [{ defect_type: 'scratch', total: 5, open_count: 2 }];
      (mockSvc.getQualityAnalysis as jest.Mock).mockResolvedValue(ok(analysis));
      const result = await ctrl.getQualityAnalysis();
      expect(result).toEqual(analysis);
    });
  });
});

// ─── RACI ─────────────────────────────────────────────────────────────────────

describe('RaciController', () => {
  let ctrl: RaciController;
  let mockSvc: jest.Mocked<Partial<RaciService>>;

  beforeEach(async () => {
    mockSvc = {
      listTasks: jest.fn(),
      createTask: jest.fn(),
      createAssessment: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaciController],
      providers: [{ provide: RaciService, useValue: mockSvc }],
    }).overrideGuard(RolesGuard).useValue(mockGuard).overrideGuard(JwtAuthGuard).useValue(mockGuard).compile();
    ctrl = module.get(RaciController);
  });

  describe('listTasks()', () => {
    it('returns RACI tasks', async () => {
      const tasks = [{ id: 1, title: 'Buyurtma qayta ishlash', status: 'pending' }];
      (mockSvc.listTasks as jest.Mock).mockResolvedValue(ok(tasks));
      const result = await ctrl.listTasks();
      expect(result).toEqual(tasks);
    });
  });

  describe('createTask()', () => {
    it('throws BadRequestException when title missing', async () => {
      await expect(ctrl.createTask({}, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('creates RACI task with valid data', async () => {
      const created = { id: 3, title: 'Test task', status: 'pending' };
      (mockSvc.createTask as jest.Mock).mockResolvedValue(ok(created));
      const result = await ctrl.createTask({ title: 'Test task', responsible_id: 5 }, adminUser);
      expect(result).toEqual(created);
    });
  });

  describe('createAssessment()', () => {
    it('throws BadRequestException when title missing', async () => {
      await expect(ctrl.createAssessment({}, adminUser)).rejects.toThrow(BadRequestException);
    });
  });
});
