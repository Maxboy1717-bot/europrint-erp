/**
 * @module sprint8-migration.service
 * Sprint 8 — Seed + backfill (2026-06-06):
 *   Phase A (PART F): work_centers — EuroPrint printing factory seed (12 centres)
 *   Phase B (PART G): employees.manager_id backfill from org_departments.head_user_id
 *   Phase C (PART H): inventory_policy seed from material_cards.min_stock
 *
 * All operations are idempotent (WHERE NOT EXISTS / skip-if-null guards).
 * APPROVED: owner sprint 2026-06-06
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

/** 12 work centres for EuroPrint offset/digital/flexo printing factory */
const WORK_CENTRES = [
  { code: 'PREPRESS-1',  name: 'Pre-press (DTP)',            type: 'prepress',     capacity: 4,     eff: 0.90, cph: 35000 },
  { code: 'OFFSET-1',    name: 'Offset bosma (1-mashina)',   type: 'printing',     capacity: 10000, eff: 0.85, cph: 120000 },
  { code: 'OFFSET-2',    name: 'Offset bosma (2-mashina)',   type: 'printing',     capacity: 10000, eff: 0.82, cph: 120000 },
  { code: 'DIGITAL-1',   name: 'Raqamli bosma',              type: 'digital',      capacity: 5000,  eff: 0.88, cph: 80000 },
  { code: 'CUTTING-1',   name: 'Qirqish (1-dastgoh)',        type: 'cutting',      capacity: 20000, eff: 0.92, cph: 45000 },
  { code: 'LAMINATION',  name: 'Laminatsiya',                type: 'finishing',    capacity: 8000,  eff: 0.87, cph: 60000 },
  { code: 'BINDING',     name: 'Muqova va tikish',           type: 'binding',      capacity: 3000,  eff: 0.80, cph: 50000 },
  { code: 'FLEXO-1',     name: 'Flexoprint (qadoqlash)',     type: 'flexo',        capacity: 6000,  eff: 0.83, cph: 95000 },
  { code: 'CLICHE',      name: 'Klishe tayyorlash',          type: 'cliche',       capacity: 50,    eff: 0.95, cph: 150000 },
  { code: 'QC-STATION',  name: 'Nazorat-tekshiruv stantsiyasi', type: 'quality',   capacity: 1000,  eff: 0.98, cph: 25000 },
  { code: 'PACKING',     name: "Qadoqlash va jo'natish",     type: 'packing',      capacity: 5000,  eff: 0.91, cph: 30000 },
  { code: 'MAINT-SHOP',  name: "Ta'mirlash sexsi",           type: 'maintenance',  capacity: 2,     eff: 0.75, cph: 40000 },
] as const;

@Injectable()
export class Sprint8MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sprint8MigrationService.name);

  onApplicationBootstrap(): void {
    this.seedWorkCentres().catch((e: unknown) =>
      this.logger.warn(`Sprint8 Phase A (work_centres) failed: ${String(e)}`),
    );
    this.backfillManagerId().catch((e: unknown) =>
      this.logger.warn(`Sprint8 Phase B (manager_id) failed: ${String(e)}`),
    );
    this.seedInventoryPolicy().catch((e: unknown) =>
      this.logger.warn(`Sprint8 Phase C (inventory_policy) failed: ${String(e)}`),
    );
  }

  /** Phase A — PART F: seed 12 work centres (idempotent by code) */
  private async seedWorkCentres(): Promise<void> {
    let inserted = 0;
    for (const wc of WORK_CENTRES) {
      try {
        const r = await db.execute(sql`
          INSERT INTO work_centers (code, name, name_ru, type, capacity, is_active,
                                   hours_per_day, cost_per_hour, efficiency_rate,
                                   created_at, updated_at)
          SELECT
            ${wc.code}, ${wc.name}, ${wc.name}, ${wc.type},
            ${wc.capacity}, TRUE, 8.0, ${wc.cph}, ${wc.eff},
            NOW(), NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM work_centers WHERE code = ${wc.code}
          )
        `);
        const cnt = (r as { rowCount?: number }).rowCount ?? 0;
        inserted += cnt;
      } catch (e: unknown) {
        this.logger.warn(`Sprint8-A: work_center ${wc.code} skip — ${String(e)}`);
      }
    }
    this.logger.log(`Sprint8 Phase A ✅ work_centres: ${inserted}/${WORK_CENTRES.length} inserted`);
  }

  /**
   * Phase B — PART G: backfill employees.manager_id
   * Logic: employee's direct org_department head → that head's employee record.
   * Skips employees already having manager_id and self-head cases.
   */
  private async backfillManagerId(): Promise<void> {
    try {
      const r = await db.execute(sql`
        UPDATE employees e
        SET manager_id    = head_emp.id,
            updated_at    = NOW()
        FROM org_departments od
        JOIN employees head_emp ON head_emp.user_id = od.head_user_id
        WHERE e.org_department_id = od.id
          AND e.manager_id IS NULL
          AND od.head_user_id IS NOT NULL
          AND head_emp.id != e.id
      `);
      const upd = (r as { rowCount?: number }).rowCount ?? 0;
      this.logger.log(`Sprint8 Phase B ✅ employees.manager_id: ${upd} rows backfilled`);
    } catch (e: unknown) {
      this.logger.warn(`Sprint8-B: manager_id backfill failed — ${String(e)}`);
    }
  }

  /**
   * Phase C — PART H: seed inventory_policy from material_cards.min_stock.
   * reorder_point = 1.5 × min_stock, safety_stock = min_stock, eoq = 3 × min_stock.
   * Only inserts rows that are not yet in inventory_policy.
   */
  private async seedInventoryPolicy(): Promise<void> {
    try {
      const r = await db.execute(sql`
        INSERT INTO inventory_policy
          (material_id, reorder_point, safety_stock, eoq, abc_class, updated_at)
        SELECT
          mc.id,
          COALESCE(mc.min_stock, 0) * 1.5,
          COALESCE(mc.min_stock, 0),
          GREATEST(COALESCE(mc.min_stock, 0) * 3, 1),
          CASE
            WHEN mc.current_stock > COALESCE(mc.max_stock, 0) * 0.5 THEN 'A'
            WHEN mc.current_stock > 0 THEN 'B'
            ELSE 'C'
          END,
          NOW()
        FROM material_cards mc
        WHERE NOT EXISTS (
          SELECT 1 FROM inventory_policy ip WHERE ip.material_id = mc.id
        )
      `);
      const ins = (r as { rowCount?: number }).rowCount ?? 0;
      this.logger.log(`Sprint8 Phase C ✅ inventory_policy: ${ins} rows seeded`);
    } catch (e: unknown) {
      this.logger.warn(`Sprint8-C: inventory_policy seed failed — ${String(e)}`);
    }
  }
}
