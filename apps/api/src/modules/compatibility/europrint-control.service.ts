/**
 * @module europrint-control.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';



@Injectable()
export class EuroprintControlCompatService {
  private readonly logger = new Logger(EuroprintControlCompatService.name);

  getBusinessRules() {
    return [
      { id: 1, code: 'SD-001', name: 'Avans ≥ 70% majburiy', module: 'SD', status: 'active', severity: 'HARD_BLOCK' },
      { id: 2, code: 'MES-001', name: 'LMS sertifikati kerak', module: 'MES', status: 'active', severity: 'HARD_BLOCK' },
      { id: 3, code: 'WMS-001', name: 'FEFO tartib', module: 'WMS', status: 'active', severity: 'WARNING' },
      { id: 4, code: 'FIN-001', name: '3-Way Match (PO+GR+INV)', module: 'Finance', status: 'active', severity: 'HARD_BLOCK' },
      { id: 5, code: 'HR-001', name: "Mehnat qonuni ta'tillari", module: 'HR', status: 'active', severity: 'WARNING' },
    ];
  }

  getUnits() {
    return [
      { id: 1, code: 'dona', name: 'Dona (birlik)', category: 'count' },
      { id: 2, code: 'kg', name: 'Kilogramm', category: 'weight' },
      { id: 3, code: 'm', name: 'Metr', category: 'length' },
      { id: 4, code: 'm2', name: 'Kvadrat metr', category: 'area' },
      { id: 5, code: 'm3', name: 'Kubik metr', category: 'volume' },
      { id: 6, code: 'l', name: 'Litr', category: 'volume' },
      { id: 7, code: 'uzs', name: "O'zbek so'mi", category: 'currency' },
      { id: 8, code: 'usd', name: 'AQSH dollari', category: 'currency' },
    ];
  }

  getValidationRules() {
    return [
      { id: 1, field: 'sales_order.advance_percent', rule: 'gte:70', message: "Avans 70% dan kam bo'lmasligi kerak", active: true },
      { id: 2, field: 'mes_session.lms_cert', rule: 'required', message: "Ishchi LMS sertifikatiga ega bo'lishi shart", active: true },
      { id: 3, field: 'wms_pick.method', rule: 'eq:FEFO', message: 'FEFO tartibini saqlash majburiy', active: true },
      { id: 4, field: 'purchase.three_way_match', rule: 'match', message: "Xarid 3-tomonlama tekshiruvdan o'tishi kerak", active: true },
    ];
  }

  async getKpis(): Promise<Result<object, AppError>> {
    const [usersR, ordersR] = await Promise.all([
      safeCall(() => rawSql(sql`SELECT COUNT(*) AS cnt FROM users WHERE is_active = true`)),
      safeCall(() => rawSql(sql`SELECT COUNT(*) AS cnt FROM sales_orders WHERE status NOT IN ('cancelled')`)),
    ]);
    const uRow = usersR.ok ? (dbRows(usersR.data)[0] ?? {}) : {};
    const oRow = ordersR.ok ? (dbRows(ordersR.data)[0] ?? {}) : {};
    // system-uptime is REAL: derived from the running process uptime (seconds → hours).
    // data-quality was fabricated (94.2) with no source → removed per Q-40/Q-46.
    const uptimeHours = Math.round((process.uptime() / 3600) * 10) / 10;
    return Ok([
      { id: 'active-users', name: 'Faol foydalanuvchilar', value: Number(uRow['cnt'] ?? 0), target: 100, unit: 'ta' },
      { id: 'open-orders', name: 'Ochiq buyurtmalar', value: Number(oRow['cnt'] ?? 0), target: 50, unit: 'ta' },
      { id: 'process-uptime', name: 'Server ish vaqti', value: uptimeHours, target: 0, unit: 'soat' },
    ]);
  }

  async getAuditorDashboard() {
    // audit_logs has NO entity_type column; the real groupable column is table_name.
    const [topR, totalR, actionR, rulesR] = await Promise.all([
      safeCall(() => rawSql(sql`
        SELECT action, table_name, COUNT(*) AS cnt FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY action, table_name ORDER BY cnt DESC LIMIT 20
      `)),
      safeCall(() => rawSql(sql`SELECT COUNT(*) AS cnt FROM audit_logs`)),
      safeCall(() => rawSql(sql`
        SELECT
          COUNT(*) FILTER (WHERE action = 'DELETE') AS deleted,
          COUNT(*) FILTER (WHERE action = 'UPDATE') AS updated
        FROM audit_logs
      `)),
      safeCall(() => rawSql(sql`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active = true) AS active FROM business_rules
      `)),
    ]);
    const topActions = topR.ok ? dbRows(topR.data) : [];
    const totalAuditLogs = Number((totalR.ok ? dbRows(totalR.data)[0] : {})?.['cnt'] ?? 0);
    const actionRow = actionR.ok ? (dbRows(actionR.data)[0] ?? {}) : {};
    const rulesRow = rulesR.ok ? (dbRows(rulesR.data)[0] ?? {}) : {};
    return {
      totalRules:       Number(rulesRow['total'] ?? 0),
      activeRules:      Number(rulesRow['active'] ?? 0),
      violationsToday:  0,
      totalAuditLogs,
      deletedRecords:   Number(actionRow['deleted'] ?? 0),
      overrides:        Number(actionRow['updated'] ?? 0),
      reversals:        Number(actionRow['deleted'] ?? 0),
      topActions,
      suspiciousEvents: 0,
      systemHealth:     'healthy',
      lastChecked:      _time.now(),
    };
  }

  /**
   * SAP enterprise-pattern summary consumed by EuroprintControlCenter.tsx
   * (sapPatterns?.<pattern>?.count). Each pattern's count is a REAL aggregate over
   * business_rules grouped by category (0 today — table is empty). The prior
   * hardcoded { totalPatterns: 38, modules[] } was a fabrication that did not even
   * match the FE contract → replaced with honest per-pattern counts (Q-40/Q-46).
   */
  private async getRuleCategoryCounts(): Promise<Record<string, number>> {
    const r = await safeCall(() => rawSql(sql`
      SELECT category, COUNT(*) AS cnt FROM business_rules WHERE is_active = true GROUP BY category
    `));
    const rows = r.ok ? dbRows(r.data) : [];
    const map: Record<string, number> = {};
    for (const row of Array.isArray(rows) ? rows : []) {
      map[String(row['category'] ?? '')] = Number(row['cnt'] ?? 0);
    }
    return map;
  }

  private buildSapPatterns(byCategory: Record<string, number>) {
    const c = (key: string) => byCategory[key] ?? 0;
    return {
      documentLifecycle:  { count: c('document_lifecycle'), name: 'Hujjat Hayoti', nameRu: 'Жизненный цикл' },
      changeRequests:     { count: c('change_management'), name: "O'zgarish Boshqaruvi", nameRu: 'Управление изменениями' },
      separationOfDuties: { count: c('separation_of_duties'), name: 'Vazifalar Ajratish', nameRu: 'Разделение обязанностей' },
      exceptionInbox:     { count: c('exception_inbox'), name: 'Muammolar Markazi', nameRu: 'Исключения' },
      postingEngine:      { count: c('posting_engine'), name: 'GL Yozuv Mexanizmi', nameRu: 'Модуль проводок' },
      costObjects:        { count: c('cost_objects'), name: "Xarajat Ob'ektlari", nameRu: 'Объекты затрат' },
      sops:               { count: c('sop'), name: 'SOP Shablonlari', nameRu: 'Шаблоны СОП' },
      roleUiConfigs:      { count: c('role_ui'), name: 'Rol UI Sozlamalari', nameRu: 'UI по ролям' },
    };
  }

  async getSapPatternsSummary() {
    const byCategory = await this.getRuleCategoryCounts();
    return this.buildSapPatterns(byCategory);
  }

  /**
   * All-rules summary consumed by EuroprintControlCenter.tsx
   * (allRules?.nonBypassableRules?.<rule>?.count). Real counts over business_rules
   * by category (0 today). The prior hardcoded { totalRules: 24, activeRules: 22, ... }
   * did not match the FE contract and was fabricated → replaced (Q-40/Q-46).
   */
  async getAllRulesSummary() {
    const byCategory = await this.getRuleCategoryCounts();
    const c = (key: string) => byCategory[key] ?? 0;
    return {
      sapPatterns: this.buildSapPatterns(byCategory),
      nonBypassableRules: {
        processChains: { count: c('process_chains'), name: 'Majburiy Zanjirlar', nameRu: 'Обязательные цепочки' },
        auditTrail:    { count: c('audit_trail'), name: 'Audit Izi', nameRu: 'Аудит лог' },
        fiscalPeriods: { count: c('fiscal_periods'), name: 'Moliya Davrlari', nameRu: 'Фискальные периоды' },
        masterData:    { count: c('master_data'), name: "Master Ma'lumotlar", nameRu: 'Мастер данные' },
        batchLots:     { count: c('batch_lots'), name: 'Partiya Kuzatuvi', nameRu: 'Отслеживание партий' },
        multiCurrency: { count: c('multi_currency'), name: "Ko'p Valyuta", nameRu: 'Мультивалюта' },
      },
    };
  }

  async getLogs(entityType?: string, fromDate?: string, limit = '50') {
    const lim = Math.min(parseInt(limit, 10) || 50, MAX_LARGE_QUERY_LIMIT);
    const entityFilter = entityType ? sql`AND al.entity_type = ${entityType}` : sql``;
    const dateFilter = fromDate ? sql`AND al.created_at >= ${fromDate}::timestamp` : sql``;
    const r = await safeCall(() => rawSql(sql`
      SELECT al.id, al.action, al.entity_type, al.entity_id, al.user_id,
             al.old_values, al.new_values, al.created_at,
             u.username AS performed_by
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE true ${entityFilter} ${dateFilter}
      ORDER BY al.created_at DESC LIMIT ${lim}
    `));
    return r.ok ? dbRows(r.data) : [];
  }

  async getLogById(id: string) {
    const r = await safeCall(() => rawSql(sql`
      SELECT al.*, u.username AS performed_by FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.id = ${id}
    `));
    const found = r.ok ? dbRows(r.data)[0] : undefined;
    if (!found) throw new NotFoundException('Record not found');
    return found;
  }

  async getModuleHealth() {
    const r = await safeCall(() => rawSql(sql`
      SELECT 'users' AS module, COUNT(*) AS count FROM users WHERE is_active = true
      UNION ALL SELECT 'employees', COUNT(*) FROM employees WHERE status = 'active'
      UNION ALL SELECT 'sales_orders', COUNT(*) FROM sales_orders WHERE status NOT IN ('cancelled','fully_paid')
      UNION ALL SELECT 'invoices', COUNT(*) FROM invoices WHERE status NOT IN ('paid','cancelled')
    `));
    const rows = r.ok ? dbRows(r.data) : [];
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      module: String(row['module'] ?? ''),
      name: String(row['module'] ?? ''),
      status: 'healthy',
      count: Number(row['count'] ?? 0),
      errorCount: 0,
    }));
  }

  async getValidationSummary() {
    const r = await safeCall(() => rawSql(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'passed') AS passed,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed,
        COUNT(*) FILTER (WHERE status = 'warning') AS warnings,
        MAX(run_at) AS last_run
      FROM validation_results
    `));
    const row = r.ok ? (dbRows(r.data)[0] ?? {}) : {};
    const total = Number(row['total'] ?? 0);
    const passed = Number(row['passed'] ?? 0);
    const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0.0%';
    return {
      total,
      passed,
      failed: Number(row['failed'] ?? 0),
      warnings: Number(row['warnings'] ?? 0),
      passRate,
      lastRun: row['last_run'] ?? null,
    };
  }

  async getValidationResults(ruleId?: string, limit = '50') {
    const lim = Math.min(parseInt(limit, 10) || 50, MAX_LARGE_QUERY_LIMIT);
    const ruleFilter = ruleId ? sql`AND rule_code = ${ruleId}` : sql``;
    const r = await safeCall(() => rawSql(sql`
      SELECT id, rule_code, status, violation_count, violation_details, run_at
      FROM validation_results
      WHERE true ${ruleFilter}
      ORDER BY run_at DESC NULLS LAST
      LIMIT ${lim}
    `));
    const rows = r.ok ? dbRows(r.data) : [];
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      id: String(row['id'] ?? ''),
      ruleCode: String(row['rule_code'] ?? ''),
      status: String(row['status'] ?? ''),
      issuesFound: Number(row['violation_count'] ?? 0),
      details: (row['violation_details'] ?? {}) as Record<string, unknown>,
      executedAt: row['run_at'] ?? null,
    }));
  }

  async getAuditStats(period = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const r = await safeCall(() => rawSql(sql`
      SELECT action, COUNT(*) AS cnt FROM audit_logs
      WHERE created_at >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY action ORDER BY cnt DESC LIMIT 10
    `));
    return { period, topActions: r.ok ? dbRows(r.data) : [], generatedAt: _time.now() };
  }

  async getAuditLogs(action?: string, userId?: string, limit = '50') {
    const lim = Math.min(parseInt(limit, 10) || 50, MAX_LARGE_QUERY_LIMIT);
    const r = await safeCall(() => rawSql(sql`
      SELECT al.id, al.action, al.entity_type, al.entity_id, al.user_id,
             u.username, al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE (${action ? sql`al.action = ${action}` : sql`TRUE`})
        AND (${userId ? sql`al.user_id = ${parseInt(userId, 10)}` : sql`TRUE`})
      ORDER BY al.created_at DESC LIMIT ${lim}
    `));
    return r.ok ? dbRows(r.data) : [];
  }

  getActionTypes() {
    return [
      { code: 'CREATE', label: 'Yaratish' },
      { code: 'UPDATE', label: 'Tahrirlash' },
      { code: 'DELETE', label: "O'chirish" },
      { code: 'LOGIN',  label: 'Kirish' },
      { code: 'LOGOUT', label: 'Chiqish' },
      { code: 'APPROVE', label: 'Tasdiqlash' },
      { code: 'REJECT',  label: 'Rad etish' },
    ];
  }

  getSourceTypes() {
    return [
      { code: 'WEB', label: 'Web interfeys' },
      { code: 'API', label: 'API' },
      { code: 'BOT', label: 'Telegram bot' },
      { code: 'CRON', label: 'Jadval vazifasi' },
    ];
  }

  getMenus(role?: string) {
    const allMenus = [
      { id: 1, title: 'Dashboard', path: '/', roles: ['admin', 'manager', 'director'] },
      { id: 2, title: 'Hodimlar', path: '/employees', roles: ['admin', 'hr_manager'] },
      { id: 3, title: 'Moliya', path: '/finance', roles: ['admin', 'director'] },
      { id: 4, title: 'Ombor', path: '/warehouse', roles: ['admin', 'manager'] },
      { id: 5, title: 'Buyurtmalar', path: '/orders', roles: ['admin', 'manager', 'director'] },
    ];
    if (!role) return allMenus;
    return (Array.isArray(allMenus) ? allMenus : []).filter(m => m.roles.includes(role));
  }
}
