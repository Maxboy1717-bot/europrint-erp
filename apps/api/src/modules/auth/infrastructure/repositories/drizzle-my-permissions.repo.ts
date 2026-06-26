/**
 * MyPermissions repository — foydalanuvchining position huquqlarini DB'dan o'qiydi.
 *
 * ARCHITECTURE.md §7.7 — `users JOIN positions JOIN departments` +
 * `position_permissions` va `position_feature_flags` separate query'lar.
 *
 * Eslatma: `@europrint/schemas` `positions` stub kompat versiyasi (`code`, `name_uz`,
 * `rbac_tier` ustunlari yo'q). Shuning uchun rawSql ishlatamiz — DB'dagi haqiqiy
 * ustunlardan o'qiymiz (lib/db schema bo'yicha).
 *
 * Repository pattern: handler `db.*` ishlatmaydi, faqat shu metodlar orqali.
 * Result<T> pattern: try/catch + Ok/Err.
 */
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows, type DbRow } from '../../../hr/common/db-rows';

export interface UserPositionRow extends DbRow {
  userId: number;
  username: string;
  role: string | null;
  positionId: number | null;
  positionCode: string | null;
  positionNameUz: string | null;
  positionNameRu: string | null;
  rbacTier: string | null;
  departmentCode: string | null;
  departmentNameUz: string | null;
}

export interface ModulePermRow extends DbRow {
  module: string;
  level: string;
}

interface FeatureFlagRow extends DbRow {
  featureKey: string;
  isAllowed: boolean;
}

@Injectable()
export class DrizzleMyPermissionsRepository {
  /**
   * users + positions + departments JOIN.
   * Foydalanuvchining position va department ma'lumotlarini bir marta o'qiydi.
   */
  async findUserWithPosition(userId: number): Promise<Result<UserPositionRow | null>> {
    try {
      // EP-ORG-003 card-gate: RBAC tier resolves CARD-FIRST. Same canonical path as
      // drizzle-auth.repo.resolveCardGate: users.card_id → org_departments (FAZA-00 kanonik
      // karta jadvali). Priority: primary card (od.rbac_tier) → org_functions (ofn.rbac_tier)
      // → positions (p.rbac_tier) for card-less users (e.g. the admin account).
      // COALESCE → card-first, fallback eski; never breaks (post-login path, degrades gracefully).
      const rows = await rawSql(sql`
        SELECT
          u.id                                          AS "userId",
          u.username                                    AS username,
          u.role                                        AS role,
          p.id                                          AS "positionId",
          p.code                                        AS "positionCode",
          p.name_uz                                     AS "positionNameUz",
          p.name_ru                                     AS "positionNameRu",
          COALESCE(od.rbac_tier, ofn.rbac_tier, p.rbac_tier) AS "rbacTier",
          d.code                                        AS "departmentCode",
          d.name_uz                                     AS "departmentNameUz"
        FROM users u
        LEFT JOIN positions p       ON p.id = u.position_id
        LEFT JOIN org_functions ofn ON ofn.id = u.org_function_id AND ofn.deleted_at IS NULL
        LEFT JOIN org_departments od ON od.id = u.card_id
        LEFT JOIN departments d     ON d.id = u.department_id
        WHERE u.id = ${userId}
        LIMIT 1
      `);
      const data = dbRows<UserPositionRow>(rows);
      const safe = Array.isArray(data) ? data : [];
      return Ok(safe[0] ?? null);
    } catch (e: unknown) {
      return Err(`findUserWithPosition: ${String(e)}`);
    }
  }

  /**
   * position_permissions — module + level juftliklari.
   */
  async findModulePermissions(positionId: number): Promise<Result<ReadonlyArray<ModulePermRow>>> {
    try {
      const rows = await rawSql(sql`
        SELECT module_code AS module, access_level AS level
        FROM position_permissions
        WHERE position_id = ${positionId}
      `);
      const data = dbRows<ModulePermRow>(rows);
      return Ok(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      return Err(`findModulePermissions: ${String(e)}`);
    }
  }

  /**
   * position_feature_flags — faqat is_allowed=true bo'lgan kalitlar.
   */
  async findFeatureFlags(positionId: number): Promise<Result<ReadonlyArray<string>>> {
    try {
      const rows = await rawSql(sql`
        SELECT feature_key AS "featureKey", is_allowed AS "isAllowed"
        FROM position_feature_flags
        WHERE position_id = ${positionId}
      `);
      const data = dbRows<FeatureFlagRow>(rows);
      const safe = Array.isArray(data) ? data : [];
      const allowed = safe.filter((r) => r.isAllowed === true).map((r) => r.featureKey);
      return Ok(allowed);
    } catch (e: unknown) {
      return Err(`findFeatureFlags: ${String(e)}`);
    }
  }
}
