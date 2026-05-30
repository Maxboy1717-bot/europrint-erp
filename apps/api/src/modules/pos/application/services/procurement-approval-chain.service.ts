/**
 * @module procurement-approval-chain.service
 * @description P2P xarid-to'lov zanjirining YADROSI — org-sxema bo'yicha ierarxik tasdiq zanjirini
 *   hisoblaydi. Maxboy talabi: "so'rov org-sxema bo'yicha DIREKTORGACHA boradi, oradagi HAR rahbar
 *   ketma-ket tasdiqlaydi". Resolver requester bo'limidan boshlab `org_departments.parent_id`
 *   zanjiri bo'ylab yuqoriga (root/direktorgacha) yuradi va har bosqichdagi `head_user_id` ni
 *   tasdiqlovchi sifatida qaytaradi (eng yaqin rahbar → direktor tartibida).
 *
 *   Data-model QAYTA ISHLATILADI (duplikat YO'Q): org_departments (ierarxiya/head), summa bo'yicha
 *   `approval_matrix_config`, tarix `multi_level_approval_history`. Bu servis faqat ZANJIRNI hisoblaydi.
 *
 *   Eslatma: bu birinchi increment — modulga ulash + P2P endpoint keyingi qadamda (PosModule providers).
 *
 * Returns Result<T> from @common/result; never throws raw Errors.
 */
import { Injectable, Logger } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

export interface ApprovalStep {
  depth: number;            // 0 = requester bo'limi, ortgan sari yuqori
  level: number | null;     // org_departments.level
  orgDepartmentId: number;
  departmentName: string;
  approverUserId: number;   // head_user_id — shu bosqich tasdiqlovchisi
}

@Injectable()
export class ProcurementApprovalChainService {
  private readonly logger = new Logger(ProcurementApprovalChainService.name);

  /**
   * Xodimning birlamchi (is_primary) org-bo'limini topadi.
   * Topilmasa — istalgan biriktirilgan bo'limni oladi.
   */
  async findEmployeeDepartment(employeeId: number): Promise<Result<number | null, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT org_department_id
        FROM employee_org_departments
        WHERE employee_id = ${employeeId} AND org_department_id IS NOT NULL
        ORDER BY is_primary DESC NULLS LAST, assigned_at ASC
        LIMIT 1
      `);
      const row = dbRows(r)[0];
      return row ? Number(row['org_department_id']) : null;
    });
  }

  /**
   * Bo'limdan boshlab org-sxema yuqorisiga (root/direktorgacha) tasdiq zanjirini hisoblaydi.
   * Har bosqichdagi head_user_id — tasdiqlovchi. `excludeUserId` (so'rov beruvchi) o'zini
   * tasdiqlamasligi uchun chiqarib tashlanadi.
   */
  async resolveChainFromDepartment(
    orgDepartmentId: number,
    excludeUserId?: number,
  ): Promise<Result<ApprovalStep[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        WITH RECURSIVE chain AS (
          SELECT id, parent_id, head_user_id, level, 0 AS depth
          FROM org_departments
          WHERE id = ${orgDepartmentId}
          UNION ALL
          SELECT o.id, o.parent_id, o.head_user_id, o.level, c.depth + 1
          FROM org_departments o
          JOIN chain c ON o.id = c.parent_id
        )
        SELECT c.id::int AS org_department_id,
               COALESCE(od.name, '') AS department_name,
               c.head_user_id::int   AS approver_user_id,
               c.level::int          AS level,
               c.depth::int          AS depth
        FROM chain c
        LEFT JOIN org_departments od ON od.id = c.id
        WHERE c.head_user_id IS NOT NULL
        ORDER BY c.depth ASC
      `);
      const steps: ApprovalStep[] = dbRows(r)
        .map((row) => ({
          depth:           Number(row['depth']),
          level:           row['level'] == null ? null : Number(row['level']),
          orgDepartmentId: Number(row['org_department_id']),
          departmentName:  String(row['department_name'] ?? ''),
          approverUserId:  Number(row['approver_user_id']),
        }))
        // So'rov beruvchi o'zini tasdiqlamaydi; ketma-ket dublikat head'larni ham yig'amaymiz
        .filter((s) => s.approverUserId && s.approverUserId !== excludeUserId);

      // Ketma-ket bir xil approver (bir odam bir necha bo'lim boshlig'i) — bir marta qoldiramiz
      const deduped: ApprovalStep[] = [];
      for (const s of steps) {
        if (deduped.length === 0 || deduped[deduped.length - 1].approverUserId !== s.approverUserId) {
          deduped.push(s);
        }
      }
      return deduped;
    });
  }

  /**
   * Xodim uchun to'liq tasdiq zanjiri (bo'lim topish + yuqoriga yurish).
   */
  async resolveChainForEmployee(
    employeeId: number,
    requesterUserId?: number,
  ): Promise<Result<ApprovalStep[], AppError>> {
    return safeCall(async () => {
      const deptR = await this.findEmployeeDepartment(employeeId);
      if (!deptR.ok) throw deptR.error;
      const deptId = deptR.data;
      if (deptId == null) {
        this.logger.warn(`[P2P] Xodim ${employeeId} uchun org-bo'lim topilmadi — tasdiq zanjiri bo'sh`);
        return [];
      }
      const chainR = await this.resolveChainFromDepartment(deptId, requesterUserId);
      if (!chainR.ok) throw chainR.error;
      return chainR.data;
    });
  }
}
