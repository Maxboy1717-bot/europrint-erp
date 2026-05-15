/**
 * /api/agents/* — barcha 14 agent endpointlari
 */
import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';

// ─── Zod schemas (Rule 3) ───────────────────────────────────────────────────
const AskSchema      = z.object({ question: z.string().min(1).max(2000) });
const RollAssignSchema = z.object({
  rollId: z.string().min(1),
  articleCode: z.string().min(1),
  supplierId: z.number().int().positive().optional(),
  supplierName: z.string().optional(),
}).passthrough();
const RollConsumeSchema = z.object({
  rollDbId: z.string().min(1),
  usedWeightKg: z.number().positive(),
  productionOrderId: z.string().optional(),
});
const MkContentSchema = z.object({
  brief: z.string().min(1).max(5000),
  lang: z.enum(['uz', 'ru']).optional(),
});
const ScenarioSchema = z.object({ scenario: z.string().min(1).max(5000) });
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

import { DirectorAgentService } from './director-agent.service';
import { LeadScoringAgentService } from './lead-scoring-agent.service';
import { ProductionAgentService } from './production-agent.service';
import { InventoryAgentService } from './inventory-agent.service';
import { CashflowAgentService } from './cashflow-agent.service';
import { SupplierAgentService } from './supplier-agent.service';
import { HrPerformanceAgentService } from './hr-performance-agent.service';
import { QualityAgentService } from './quality-agent.service';
import { SecurityAgentService } from './security-agent.service';
import { MarketingAgentService } from './marketing-agent.service';
import { LmsAgentService } from './lms-agent.service';
import { IotAgentService } from './iot-agent.service';
import { FacilitiesAgentService } from './facilities-agent.service';
import { StrategicAgentService } from './strategic-agent.service';
import { AgentAlertService } from './shared/agent-alert.service';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'director', 'ceo', 'manager', 'cfo', 'hr_head', 'employee')
export class AgentsController {
  constructor(
    private readonly director:    DirectorAgentService,
    private readonly leadScoring: LeadScoringAgentService,
    private readonly production:  ProductionAgentService,
    private readonly inventory:   InventoryAgentService,
    private readonly cashflow:    CashflowAgentService,
    private readonly supplier:    SupplierAgentService,
    private readonly hr:          HrPerformanceAgentService,
    private readonly quality:     QualityAgentService,
    private readonly security:    SecurityAgentService,
    private readonly marketing:   MarketingAgentService,
    private readonly lms:         LmsAgentService,
    private readonly iot:         IotAgentService,
    private readonly facilities:  FacilitiesAgentService,
    private readonly strategic:   StrategicAgentService,
    private readonly alerts:      AgentAlertService,
  ) {}

  // ── DIRECTOR ──────────────────────────────────────────────────────
  @Get('director/briefing')
  @Roles('director', 'super_admin', 'admin', 'ceo')
  briefing() { return this.director.getDailyBriefing(); }

  @Post('director/ask')
  @Roles('director', 'super_admin', 'admin', 'ceo')
  ask(@Body() body: unknown, @CurrentUser() u: { id: number }) {
    const dto = AskSchema.parse(body);
    return this.director.askAdvisor(dto.question, u.id);
  }

  @Get('director/module-health')
  @Roles('director', 'super_admin', 'admin', 'ceo')
  moduleHealth() { return this.director.getModuleHealth(); }

  // ── CRM ───────────────────────────────────────────────────────────
  @Get('crm/score-leads')                         scoreLeads()                                     { return this.leadScoring.scoreLeads(); }
  @Post('crm/proposal/:leadId')                   proposal(@Param('leadId') leadId: string)         { return this.leadScoring.generateProposal(Number(leadId)); }
  @Get('crm/customer360/:id')                     customer360(@Param('id') id: string)              { return this.leadScoring.getCustomer360(Number(id)); }
  @Get('crm/churn/:id')                           churn(@Param('id') id: string)                    { return this.leadScoring.predictChurn(Number(id)); }

  // ── PRODUCTION ────────────────────────────────────────────────────
  @Get('production/monitor')                      productionMonitor()                              { return this.production.monitorOrders(); }
  @Get('production/oee')                          oee(@Query('machineId') m: string, @Query('date') d: string) { return this.production.calculateOEE(m, d); }
  @Get('production/bottleneck')                   bottleneck()                                     { return this.production.detectBottleneck(); }
  @Get('production/shift-report/:shiftId')        shiftReport(@Param('shiftId') s: string)         { return this.production.generateShiftReport(s); }

  // ── INVENTORY ─────────────────────────────────────────────────────
  @Get('inventory/forecast/:materialId')          forecast(@Param('materialId') m: string, @Query('days') days?: string) { return this.inventory.forecastDemand(Number(m), days ? Number(days) : 30); }
  @Get('inventory/critical')                      critical()                                       { return this.inventory.checkCriticalStock(); }
  @Get('inventory/abc')                           abc()                                            { return this.inventory.abcAnalysis(); }
  @Get('inventory/rolls')                         rolls()                                          { return this.inventory.getRollBalance(); }
  @Get('inventory/rolls/fifo')                    rollsFifo(@Query('articleCode') c: string)        { return this.inventory.getFIFOQueue(c); }
  @Post('inventory/rolls/scan')                   rollsScan(@Body() raw: unknown) {
    const b = RollAssignSchema.parse(raw) as Parameters<typeof this.inventory.scanRoll>[0];
    return this.inventory.scanRoll(b);
  }
  @Post('inventory/rolls/use')                    rollsUse(@Body() raw: unknown, @CurrentUser() u: { id: number }) {
    const b = RollConsumeSchema.parse(raw);
    return this.inventory.trackRollUsage({ ...b, usedByUserId: u.id });
  }
  @Get('inventory/rolls/qr/:dbId')                rollsQr(@Param('dbId') id: string)                { return this.inventory.rollQRCode(id); }

  // ── FINANCE ───────────────────────────────────────────────────────
  @Get('finance/cashflow')                        cf(@Query('days') days?: string)                  { return this.cashflow.forecastCashFlow(days ? Number(days) : 30); }
  @Get('finance/overdue')                         overdue()                                        { return this.cashflow.checkOverduePayments(); }
  @Get('finance/fraud')                           fraud()                                          { return this.cashflow.detectFraud(); }

  // ── SUPPLIER ──────────────────────────────────────────────────────
  @Get('supplier/scores')                         supplierScores()                                 { return this.supplier.scoreSuppliers(); }
  @Get('supplier/risks')                          supplierRisks()                                  { return this.supplier.detectDeliveryRisks(); }

  // ── HR ────────────────────────────────────────────────────────────
  @Get('hr/performance')                          perfDefault(@Query('id') id?: string)            { return this.hr.analyzePerformance(Number(id ?? 1)); }
  @Get('hr/performance/:id')                      perf(@Param('id') id: string)                    { return this.hr.analyzePerformance(Number(id)); }
  @Get('hr/churn')                                hrChurnDefault(@Query('id') id?: string)         { return this.hr.predictChurn(Number(id ?? 1)); }
  @Get('hr/churn/:id')                            hrChurn(@Param('id') id: string)                 { return this.hr.predictChurn(Number(id)); }
  @Get('hr/bonus')
  bonusDefault(@Query('id') id?: string, @Query('base') b?: string) {
    const base = Number(b);
    if (!b || isNaN(base) || base < 0) {
      throw new BadRequestException("Base maosh to'g'ri kiritilmagan");
    }
    return this.hr.calculateBonus(Number(id ?? 1), base);
  }
  @Get('hr/bonus/:id')
  bonus(@Param('id') id: string, @Query('base') b: string) {
    const base = Number(b);
    if (!b || isNaN(base) || base < 0) {
      throw new BadRequestException("Base maosh to'g'ri kiritilmagan");
    }
    return this.hr.calculateBonus(Number(id), base);
  }

  // ── QUALITY ───────────────────────────────────────────────────────
  @Get('quality/trend')                           qcTrend()                                        { return this.quality.trackBrakTrend(); }
  @Get('quality/quarantine')                      quarantine()                                     { return this.quality.manageQuarantine(); }

  // ── SECURITY ──────────────────────────────────────────────────────
  @Get('security/access-attempts')                accessAttempts()                                  { return this.security.monitorAccessAttempts(); }
  @Get('security/audit-anomalies')                auditAnomalies()                                 { return this.security.analyzeAuditLog(); }

  // ── MARKETING ─────────────────────────────────────────────────────
  @Get('marketing/roi/:campaignId')               mkRoi(@Param('campaignId') c: string)            { return this.marketing.analyzeMarketingROI(c); }
  @Post('marketing/content')                      mkContent(@Body() raw: unknown) {
    const b = MkContentSchema.parse(raw);
    return this.marketing.generateContent(b.brief, b.lang);
  }
  @Get('marketing/segments')                      mkSegments()                                     { return this.marketing.segmentCustomers(); }

  // ── LMS ───────────────────────────────────────────────────────────
  @Get('lms/progress/:id')                        lmsProgress(@Param('id') id: string)             { return this.lms.trackProgress(Number(id)); }
  @Get('lms/expiry')                              lmsExpiry()                                      { return this.lms.checkCertificateExpiry(); }

  // ── IOT ───────────────────────────────────────────────────────────
  @Get('iot/sensor')                              iotSensorDefault(@Query('machineId') m?: string) { return this.iot.collectSensorData(m ?? 'MACHINE_001'); }
  @Get('iot/sensor/:machineId')                   iotSensor(@Param('machineId') m: string)         { return this.iot.collectSensorData(m); }
  @Get('iot/anomaly/:machineId')                  iotAnomaly(@Param('machineId') m: string)        { return this.iot.detectAnomalies(m); }
  @Get('iot/rul/:machineId')                      iotRul(@Param('machineId') m: string)            { return this.iot.predictFailure(m); }

  // ── FACILITIES ────────────────────────────────────────────────────
  @Get('facilities/utility')                      utility(@Query('month') m: string)                { return this.facilities.trackUtilityBills(m); }
  @Get('facilities/maintenance')                  maintenance()                                    { return this.facilities.schedulePreventiveMaintenance(); }
  @Get('facilities/supplies')                     supplies()                                       { return this.facilities.monitorOfficeSupplies(); }

  // ── STRATEGIC ─────────────────────────────────────────────────────
  @Post('strategic/scenario')
  @Roles('director', 'super_admin', 'admin', 'ceo')
  scenario(@Body() raw: unknown) {
    const b = ScenarioSchema.parse(raw);
    return this.strategic.scenarioAnalysis(b.scenario);
  }

  @Get('strategic/forecast-revenue')
  @Roles('director', 'super_admin', 'admin', 'cfo', 'ceo')
  forecastRev(@Query('months') m?: string) { return this.strategic.forecastRevenue(m ? Number(m) : 6); }

  @Get('strategic/investment')
  @Roles('director', 'super_admin', 'admin', 'cfo', 'ceo')
  investment() { return this.strategic.recommendCapitalInvestment(); }

  // ── ALERTS (foydalanuvchi uchun) ──────────────────────────────────
  @Get('alerts')
  myAlerts(@CurrentUser() u: { id: number; role?: string }, @Query('limit') l?: string) {
    const limit = l ? Number(l) : 30;
    return this.alerts.listForUser(u.id, u.role, limit);
  }

  @Post('alerts/:id/read')                        readAlert(@Param('id') id: string, @CurrentUser() u: { id: number })   { return this.alerts.markRead(id, u.id); }
}
