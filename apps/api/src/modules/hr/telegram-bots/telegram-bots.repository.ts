/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   date-part comparisons, AGE() arithmetic, regex membership,
 *   interval-multiplied parameter, and NOT EXISTS correlated subqueries.
 *   See ARCHITECTURE_RULES.md Rule 4.
 *
 * @module telegram-bots.repository
 * @description Repository facade. Implementation split into sub-repos under
 *   ./telegram-bots/ to satisfy Rule 16 (file size). Each sub-repo is its own
 *   @Injectable; the facade delegates to them transparently so callers keep
 *   the same `telegramRepo.someMethod(...)` API.
 */

import { Injectable } from '@nestjs/common';
import { TelegramBotsEmployeesRepo } from './telegram-bots/employees.repo';
import { TelegramBotsEventsRepo } from './telegram-bots/events.repo';
import { TelegramBotsManagerRepo } from './telegram-bots/manager.repo';
import { TelegramBotsProfileRepo } from './telegram-bots/profile.repo';

export { TelegramBotsEmployeesRepo, TelegramBotsEventsRepo, TelegramBotsManagerRepo, TelegramBotsProfileRepo };

@Injectable()
export class TelegramBotsRepository {
  constructor(
    private readonly employees: TelegramBotsEmployeesRepo,
    private readonly events: TelegramBotsEventsRepo,
    private readonly manager: TelegramBotsManagerRepo,
    private readonly profile: TelegramBotsProfileRepo,
  ) {}

  // ─── Employees / chat-id / candidates ────────────────────────────────────
  insertFallbackNotification = (m: string) => this.employees.insertFallbackNotification(m);
  getActiveTelegramChatIds = () => this.employees.getActiveTelegramChatIds();
  getEmployeeTelegramChatId = (id: number) => this.employees.getEmployeeTelegramChatId(id);
  insertNotificationByEmployeeId = (id: number, m: string) => this.employees.insertNotificationByEmployeeId(id, m);
  getEmployeeByChatId = (c: number) => this.employees.getEmployeeByChatId(c);
  findEmployeeByPhone = (p: string) => this.employees.findEmployeeByPhone(p);
  linkEmployeeChatId = (e: number, c: number) => this.employees.linkEmployeeChatId(e, c);
  getActiveEmployeesWithChatId = () => this.employees.getActiveEmployeesWithChatId();
  getAllActiveChatIds = () => this.employees.getAllActiveChatIds();
  terminateEmployee = (id: number) => this.employees.terminateEmployee(id);
  completeOffboardingCase = (id: number) => this.employees.completeOffboardingCase(id);
  insertTerminationBlock = (id: number) => this.employees.insertTerminationBlock(id);
  getGamificationPoints = (id: number) => this.employees.getGamificationPoints(id);
  markAdaptationNotified = (id: number) => this.employees.markAdaptationNotified(id);

  // ─── Events / dates / candidates ─────────────────────────────────────────
  getBirthdayEmployeesToday = () => this.events.getBirthdayEmployeesToday();
  getBirthdayEmployeesYesterday = () => this.events.getBirthdayEmployeesYesterday();
  getWorkAnniversaryEmployeesToday = () => this.events.getWorkAnniversaryEmployeesToday();
  getExpiringProbations = () => this.events.getExpiringProbations();
  getExpiringContracts = () => this.events.getExpiringContracts();
  getOffboardingDueEmployees = () => this.events.getOffboardingDueEmployees();
  getUnrecognizedByCameraToday = () => this.events.getUnrecognizedByCameraToday();
  getCoursesDeadlineIn3Days = () => this.events.getCoursesDeadlineIn3Days();
  getEmergencyRecipients = () => this.events.getEmergencyRecipients();
  getBoomerangCandidates = (since: string) => this.events.getBoomerangCandidates(since);
  getAbsentEmployees = (days: number) => this.events.getAbsentEmployees(days);
  archiveInactiveFunnels = () => this.events.archiveInactiveFunnels();
  archiveInactiveCandidates = () => this.events.archiveInactiveCandidates();

  // ─── Manager workflow ────────────────────────────────────────────────────
  getCurrentPendingStepId = (d: number, a: number) => this.manager.getCurrentPendingStepId(d, a);
  getDocumentEmployeeId = (id: number) => this.manager.getDocumentEmployeeId(id);
  getManagerByChatId = (c: number) => this.manager.getManagerByChatId(c);
  getPendingDocumentsForManager = (m: number) => this.manager.getPendingDocumentsForManager(m);
  approveDocument = (d: number, a: number) => this.manager.approveDocument(d, a);
  rejectDocument = (d: number, r: number, reason: string) => this.manager.rejectDocument(d, r, reason);
  getTeamForManager = (m: number) => this.manager.getTeamForManager(m);
  getDailyReportStatusForManager = (m: number) => this.manager.getDailyReportStatusForManager(m);
  getDepartmentKpi = (d: number) => this.manager.getDepartmentKpi(d);
  getManagerAlerts = (m: number) => this.manager.getManagerAlerts(m);
  recordManualAttendance = (c: number, s: string, r?: string) => this.manager.recordManualAttendance(c, s, r);
  recordLateReason = (e: number, r: string) => this.manager.recordLateReason(e, r);
  recordDepartureReason = (c: number, r: string) => this.manager.recordDepartureReason(c, r);

  // ─── Profile / training / HR cron ────────────────────────────────────────
  getEmployeeCourses = (id: number) => this.profile.getEmployeeCourses(id);
  getEmployeeCertificates = (id: number) => this.profile.getEmployeeCertificates(id);
  getEmployeeProfileByChatId = (c: number) => this.profile.getEmployeeProfileByChatId(c);
  getLeaderboard = (limit = 10) => this.profile.getLeaderboard(limit);
  getEmployeeEvaluations = (id: number) => this.profile.getEmployeeEvaluations(id);
  getEmployeeInventory = (id: number) => this.profile.getEmployeeInventory(id);
  getRecruiterChatIds = () => this.profile.getRecruiterChatIds();
  getInterviewsPendingDecision = () => this.profile.getInterviewsPendingDecision();
  getAdaptationRisks = () => this.profile.getAdaptationRisks();
  getActivePipWithPendingGoals = () => this.profile.getActivePipWithPendingGoals();
}
