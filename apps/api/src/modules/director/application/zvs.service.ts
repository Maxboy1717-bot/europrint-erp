/**
 * @module zvs.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * 2.15-summa-tasdiq-darvoza (MASTER-REJA-VIZYON-2026-07-02): summa-chegaralar (avval
 * 500k/5M HARDCODE edi) endi `approval_matrix_config` (document_type='zvs') dan o'qiladi —
 * egasi screen orqali sozlashi mumkin, qayta deploy shart emas. DB hali seed qilinmagan/erishib
 * bo'lmagan holatda (masalan test/boot-race) HARDCODE_FALLBACK_MATRIX ishlatiladi — bu ilgarigi
 * qattiq-kodlangan qiymatlarning aynan o'zi, shuning uchun konfiguratsiya yo'qligi hech qachon
 * "tasdiqsiz o'tish" tug'dirmaydi (fail-closed emas, fail-SAME-AS-BEFORE).
 *
 * Eng yuqori (top) daraja uchun — masalan >5M — ROLGA QO'SHIMCHA org-zanjir tekshiruvi ham bor:
 * so'rov beruvchining org-sxema bo'yicha haqiqiy rahbarlar zanjiri (employee_org_departments →
 * org_departments.parent_id → head_user_id, ProcurementApprovalChainService bilan bir xil naqsh)
 * aniqlansa, top-darajani rolga ega BO'LGAN LEKIN zanjirda YO'Q kishi (admin/super_admin/ceo
 * bundan mustasno — korxona darajasidagi vakolat) tasdiqlay olmaydi. Zanjir aniqlanmasa
 * (head_user_id NULL — EGASI-DATA) — eski rol-asosli xulq-atvor davom etadi (regressiya yo'q).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError, Err, Ok } from '@common/result';
import { ZVS_REPO, type IZvsRepo, type ZvsMatrixRow } from '../domain/repositories/i-zvs.repo';

/** Korxona-darajasidagi vakolat — org-zanjirda bo'lmasa ham top-darajani tasdiqlay oladi. */
const APEX_ROLES = ['admin', 'super_admin', 'ceo'];

/** DB'da approval_matrix_config hali seed qilinmagan/erishib bo'lmagan holat uchun — eski
 *  hardcode qiymatlarning aynan o'zi (fail-SAME-AS-BEFORE, fail-closed emas). */
const HARDCODE_FALLBACK_MATRIX: ZvsMatrixRow[] = [
  { minAmount: 0,       maxAmount: 500_000,   approvalLevel: 1, approverRole: 'admin,super_admin,director,ceo,cfo,finance_manager,department_head,manager' },
  { minAmount: 500_000, maxAmount: 5_000_000, approvalLevel: 2, approverRole: 'admin,super_admin,director,ceo,cfo,finance_manager' },
  { minAmount: 5_000_000, maxAmount: null,    approvalLevel: 3, approverRole: 'admin,super_admin,director,ceo' },
];

function computeLevelFromMatrix(amount: number, matrix: ZvsMatrixRow[]): number {
  for (const row of matrix) {
    const aboveMin = amount > row.minAmount || (row.minAmount === 0 && amount >= 0);
    const withinMax = row.maxAmount == null || amount <= row.maxAmount;
    if (aboveMin && withinMax) return row.approvalLevel;
  }
  // Chegaradan tashqarida qolsa (masalan matrix bo'sh oraliq) — eng yuqori darajaga tushadi.
  return matrix.length > 0 ? Math.max(...matrix.map((r) => r.approvalLevel)) : 3;
}

function rolesForLevel(level: number, matrix: ZvsMatrixRow[]): string[] {
  const row = matrix.find((r) => r.approvalLevel === level);
  if (!row) return [];
  return row.approverRole.split(',').map((r) => r.trim()).filter(Boolean);
}

function canApproveLevel(role: string, level: number, matrix: ZvsMatrixRow[]): boolean {
  return rolesForLevel(level, matrix).includes(role);
}

function getWeekStart(date?: string): string {
  const d = date ? new Date(date) : _time.now();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

@Injectable()
export class ZvsService {
  private readonly logger = new Logger(ZvsService.name);

  constructor(@Inject(ZVS_REPO) private readonly repo: IZvsRepo) {}

  /** Sozlanadigan matritsa — DB'dan; bo'sh/xato bo'lsa eski hardcode qiymatlarga tushadi (regressiya yo'q). */
  private async getMatrix(): Promise<ZvsMatrixRow[]> {
    const res = await this.repo.getZvsApprovalMatrix();
    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      if (!res.ok) this.logger.warn(`[ZVS 2.15] approval_matrix_config o'qilmadi — fallback: ${res.error.message}`);
      return HARDCODE_FALLBACK_MATRIX;
    }
    return res.data;
  }

  /** Eng yuqori (top) approval_level qiymati — shu daraja uchun org-zanjir qo'shimcha tekshiruvi qo'llanadi. */
  private topLevel(matrix: ZvsMatrixRow[]): number {
    return matrix.length > 0 ? Math.max(...matrix.map((r) => r.approvalLevel)) : 3;
  }

  async createZvsWithValidation(
    body: Record<string, unknown>,
    userId: number,
  ): Promise<Result<object, AppError>> {
    const { department_id, submitter_name, amount, purpose, priority, week_date } = body;
    if (!purpose || amount === undefined)
      return Err({ code: 'BAD_REQUEST', message: "purpose va amount majburiy" });
    const amt = safeNum(amount);
    if (isNaN(amt) || amt <= 0)
      return Err({ code: 'BAD_REQUEST', message: "amount musbat son bo'lishi kerak" });
    const matrix = await this.getMatrix();
    const level = computeLevelFromMatrix(amt, matrix);
    const weekDate = getWeekStart(week_date as string | undefined);
    return safeCall(() =>
      this.repo.createZvs(
        department_id ? Number(department_id) : null,
        userId,
        (submitter_name as string) ?? null,
        amt,
        purpose as string,
        (priority as string) ?? 'normal',
        weekDate,
        level,
      ),
    );
  }

  async listZvs(status: string | null, weekDate: string | null, departmentId: number | null) {
    return this.repo.listZvs(status, weekDate, departmentId);
  }

  async approveZvsWithAuth(
    id: number,
    userId: number,
    userRole: string,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    const existingRows = existing.data as Record<string, unknown>[];
    if (!existingRows.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const zvs = existingRows[0] as Record<string, unknown>;
    const level = Number(zvs.level);
    if (String(zvs.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "SoD ihlol: ZVS yaratuvchi uni tasdiqlay olmaydi (code: ZVS_SOD_001)" });

    const matrix = await this.getMatrix();
    if (!canApproveLevel(userRole, level, matrix)) {
      return Err({
        code: 'FORBIDDEN',
        message: `ZVS darajasi ${level}: ruxsat etilgan rollar — ${rolesForLevel(level, matrix).join(', ') || "belgilanmagan"}. Sizning rolingiz: ${userRole}`,
      });
    }

    // Katta chiqim (eng yuqori sozlangan daraja) — rolga qo'shimcha org-zanjir tekshiruvi.
    // Zanjir aniqlanmasa (EGASI-DATA: head_user_id NULL) rol-asosli tasdiq yetarli (regressiya yo'q).
    if (level >= this.topLevel(matrix) && !APEX_ROLES.includes(userRole)) {
      const chainCheck = await this.verifyOrgChainApprover(Number(zvs.submitted_by), userId);
      if (!chainCheck.ok) return chainCheck as Result<never, AppError>;
    }

    return this.repo.approveZvs(id, userId, comment);
  }

  /**
   * Katta-summa (top-daraja) tasdig'i uchun: so'rov beruvchining haqiqiy org-zanjiridagi
   * rahbarlardan biri ekanini tekshiradi. Zanjir aniqlanmasa (bo'lim/head yo'q — EGASI-DATA)
   * — Ok() qaytariladi (gate qo'llanmaydi, rol-tekshiruv yetarli, mavjud oqim buzilmaydi).
   */
  private async verifyOrgChainApprover(submittedByUserId: number, approverUserId: number): Promise<Result<true, AppError>> {
    const deptRes = await this.repo.findOrgDepartmentForSubmitter(submittedByUserId);
    if (!deptRes.ok) {
      this.logger.warn(`[ZVS 2.15] org-bo'lim aniqlanmadi (submitted_by=${submittedByUserId}) — org-zanjir gate o'tkazildi: ${deptRes.error.message}`);
      return Ok(true);
    }
    const orgDepartmentId = deptRes.data;
    if (orgDepartmentId == null) return Ok(true);

    const chainRes = await this.repo.resolveOrgChainForDepartment(orgDepartmentId, submittedByUserId);
    if (!chainRes.ok) {
      this.logger.warn(`[ZVS 2.15] org-zanjir hisoblanmadi (dept=${orgDepartmentId}) — gate o'tkazildi: ${chainRes.error.message}`);
      return Ok(true);
    }
    const chain = chainRes.data;
    if (chain.length === 0) return Ok(true); // head_user_id yo'q — EGASI-DATA, gate o'tkazildi.

    const inChain = chain.some((step) => step.approverUserId === approverUserId);
    if (!inChain) {
      return Err({
        code: 'FORBIDDEN',
        message:
          `ZVS katta-summa tasdig'i: siz so'rov beruvchining org-zanjiridagi rahbar emassiz ` +
          `(zanjir: ${chain.map((c) => `#${c.approverUserId}`).join(' → ')}). Faqat shu zanjirdagi rahbar yoki admin/super_admin/ceo tasdiqlay oladi.`,
      });
    }
    return Ok(true);
  }

  async rejectZvsWithAuth(
    id: number,
    userId: number,
    userRole: string,
    comment: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing.ok) return existing;
    const existingRows = existing.data as Record<string, unknown>[];
    if (!existingRows.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const zvs = existingRows[0] as Record<string, unknown>;
    const level = Number(zvs.level);
    if (String(zvs.submitted_by) === String(userId))
      return Err({ code: 'FORBIDDEN', message: "SoD ihlol: ZVS yaratuvchi uni rad eta olmaydi (code: ZVS_SOD_001)" });
    const matrix = await this.getMatrix();
    if (!canApproveLevel(userRole, level, matrix))
      return Err({ code: 'FORBIDDEN', message: `Sizning rolingiz (${userRole}) ushbu darajani rad etish uchun ruxsatga ega emas` });
    return this.repo.rejectZvs(id, userId, comment);
  }
}
